<template>
  <el-card class="pf-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>公示监管（公众反馈）</span>
      </div>
    </template>
    <el-form :inline="true" class="pf-filters">
      <el-form-item label="学校">
        <el-select v-model="filters.schoolId" clearable placeholder="全部" style="min-width: 220px">
          <el-option v-for="s in schools" :key="s.id" :value="s.id" :label="s.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="filters.type" clearable placeholder="全部" style="min-width: 180px">
          <el-option label="表扬" value="表扬" />
          <el-option label="建议" value="建议" />
          <el-option label="投诉" value="投诉" />
          <el-option label="评价" value="评价" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部" style="min-width: 160px">
          <el-option label="待处理" value="待处理" />
          <el-option label="已回复" value="已回复" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="load">查询</el-button>
        <el-button @click="exportCsv">导出</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="school" label="学校" width="160" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="200" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="quickReply(row)">一键回复</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="replyDlg" title="回复反馈" width="520px">
    <p>反馈内容：{{ currentRow?.content }}</p>
    <el-input v-model="replyText" type="textarea" :rows="4" placeholder="回复内容" />
    <template #footer>
      <el-button @click="replyDlg = false">取消</el-button>
      <el-button type="primary" @click="doReply">回复</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';

const schools = ref<Array<{ id: string; name: string }>>([]);
const filters = ref<{
  schoolId?: string;
  type?: '表扬' | '建议' | '投诉' | '评价' | '';
  status?: '待处理' | '已回复' | '';
}>({});
const range = ref<[Date, Date] | null>(null);
const rows = ref<any[]>([]);

async function loadSchools() {
  const stats = await api.schools();
  schools.value = (stats || []).map((s: any) => ({ id: s.id, name: s.name }));
}
function withRange(params: any) {
  const p: any = { ...params };
  if (range.value) {
    if (range.value[0]) p.start = new Date(range.value[0]).toISOString();
    if (range.value[1]) p.end = new Date(range.value[1]).toISOString();
  }
  return p;
}
async function load() {
  const res = await api.publicFeedbackList(withRange(filters.value));
  rows.value = res.items || [];
}
async function exportCsv() {
  const csv = await api.publicFeedbackExportCsv(withRange(filters.value));
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '公众反馈.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const replyDlg = ref(false);
const replyText = ref('');
const currentRow = ref<any | null>(null);
function quickReply(row: any) {
  currentRow.value = row;
  replyText.value = '感谢您的反馈，我们将尽快改进。';
  replyDlg.value = true;
}
async function doReply() {
  if (!currentRow.value) return;
  await api.publicFeedbackReply(currentRow.value.id, replyText.value);
  replyDlg.value = false;
  await load();
}

onMounted(async () => {
  await loadSchools();
  await load();
});
</script>

<style>
.pf-card {
  min-height: 480px;
}
.pf-filters {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
</style>
