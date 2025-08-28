<template>
  <el-card class="ic-card">
    <template #header
      ><div style="display: flex; align-items: center; justify-content: space-between">
        <span>资讯中心（公告+资讯）</span>
      </div></template
    >
    <el-form :inline="true" class="ic-filters">
      <el-form-item label="类型"
        ><el-select v-model="type" clearable placeholder="全部" style="width: 160px"
          ><el-option label="公告" value="公告" /><el-option label="资讯" value="资讯" /></el-select
      ></el-form-item>
      <el-form-item label="关键词"
        ><el-input v-model="q" placeholder="标题/内容" style="width: 240px" clearable
      /></el-form-item>
      <el-form-item label="日期"
        ><el-date-picker v-model="range" type="daterange" unlink-panels
      /></el-form-item>
      <el-form-item><el-switch v-model="onlyUnread" active-text="仅未读" /></el-form-item>
      <el-form-item>
        <el-button @click="load">查询</el-button>
        <el-button @click="exportCsvBtn">导出 CSV</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="filtered" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="kind" label="类型" width="100" />
      <el-table-column prop="title" label="标题" />
      <el-table-column label="状态" width="100"
        ><template #default="{ row }"
          ><el-tag :type="isRead(row) ? 'info' : 'success'" effect="plain">{{
            isRead(row) ? '已读' : '未读'
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column prop="at" label="时间" width="200" />
      <el-table-column label="操作" width="140"
        ><template #default="{ row }"
          ><el-button size="small" @click="view(row)">查看</el-button></template
        ></el-table-column
      >
    </el-table>
  </el-card>
  <el-dialog v-model="dlg" title="详情" width="720px">
    <h3>{{ detail?.title }}</h3>
    <div style="color: #666; margin-bottom: 8px">{{ detail?.at }}</div>
    <div v-if="detail?.kind === '公告'">
      <div style="white-space: pre-wrap">{{ detail?.content }}</div>
      <div v-if="(detail.attachments || []).length" style="margin-top: 8px">
        <div>附件：</div>
        <div>
          <a
            v-for="a in detail.attachments"
            :key="a.id"
            :href="a.url"
            target="_blank"
            style="margin-right: 8px"
            >{{ a.name }}</a
          >
        </div>
      </div>
    </div>
    <div v-else style="white-space: pre-wrap">{{ detail?.content }}</div>
    <template #footer><el-button @click="dlg = false">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
const type = ref<string | ''>('');
const q = ref('');
const range = ref<[Date, Date] | null>(null);
const rows = ref<any[]>([]);
const dlg = ref(false);
const detail = ref<any>(null);
const onlyUnread = ref(false);
const READ_KEY = 'info_center_read_ids';
function readSet(): Set<string> {
  try {
    const s = localStorage.getItem(READ_KEY) || '[]';
    return new Set(JSON.parse(s));
  } catch {
    return new Set();
  }
}
function saveReadSet(set: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set.values())));
}
function isRead(row: any) {
  return readSet().has(row.kind + ':' + row.id);
}
const filtered = computed(() => {
  let arr = rows.value.slice();
  if (type.value) arr = arr.filter((r) => r.kind === type.value);
  if (q.value) {
    const s = q.value.toLowerCase();
    arr = arr.filter(
      (r) =>
        (r.title || '').toLowerCase().includes(s) || (r.content || '').toLowerCase().includes(s),
    );
  }
  if (range.value) {
    const s = range.value[0] ? new Date(range.value[0]).toISOString() : undefined;
    const e = range.value[1] ? new Date(range.value[1]).toISOString() : undefined;
    if (s) arr = arr.filter((r) => r.at >= s);
    if (e) arr = arr.filter((r) => r.at <= e);
  }
  if (onlyUnread.value) {
    const set = readSet();
    arr = arr.filter((r) => !set.has(r.kind + ':' + r.id));
  }
  return arr;
});
async function load() {
  const ann = await api.sysAnnouncements({ page: 1, pageSize: 100 });
  const news = await api.sysNews({ enabled: 'true', page: 1, pageSize: 100 });
  const aRows = (ann.items || []).map((x: any) => ({ ...x, kind: '公告' }));
  const nRows = (news.items || []).map((x: any) => ({ ...x, kind: '资讯' }));
  rows.value = [...aRows, ...nRows].sort((a: any, b: any) => (a.at < b.at ? 1 : -1));
}
async function view(row: any) {
  if (row.kind === '公告') {
    detail.value = await api.sysAnnouncementDetail(row.id);
    detail.value.kind = '公告';
  } else {
    detail.value = await api.sysNewsDetail(row.id);
    detail.value.kind = '资讯';
  }
  const set = readSet();
  set.add(row.kind + ':' + row.id);
  saveReadSet(set);
  dlg.value = true;
}
function exportCsvBtn() {
  const data = filtered.value.map((r) => ({
    类型: r.kind,
    标题: r.title,
    时间: r.at,
    状态: isRead(r) ? '已读' : '未读',
  }));
  exportCsv('资讯中心', data);
}
onMounted(load);
</script>

<style>
.ic-card {
  min-height: 420px;
}
.ic-filters {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
</style>
