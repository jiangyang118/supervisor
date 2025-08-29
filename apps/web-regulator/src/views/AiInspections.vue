<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>AI 抓拍明细</span>
        <div>
          <el-button @click="onExport">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <div class="toolbar">
      <el-form :inline="true" label-width="auto" @submit.prevent>
        <el-form-item label="学校">
          <el-select
            v-model="query.schoolId"
            clearable
            filterable
            placeholder="全部学校"
            style="min-width: 220px"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" clearable filterable placeholder="全部">
            <el-option v-for="t in types" :key="t.code" :label="t.label" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部">
            <el-option label="未处理" value="OPEN" /><el-option
              label="已确认"
              value="ACK"
            /><el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="query.range"
            type="datetimerange"
            unlink-panels
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="load">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="schoolName" label="学校" />
      <el-table-column prop="typeLabel" label="类型" width="120" />
      <el-table-column prop="camera" label="通道" width="140" />
      <el-table-column label="快照" width="140">
        <template #default="{ row }">
          <el-image
            v-if="row.snapshot"
            :src="row.snapshot"
            style="width: 120px; height: 80px"
            fit="cover"
          />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="measure" label="处置" />
    </el-table>
    <div style="margin-top: 8px; display: flex; justify-content: flex-end">
      <el-pagination
        layout="prev, pager, next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const schools = ref<Array<{ id: string; name: string; linked?: boolean }>>([]);
const types = ref<Array<{ code: string; label: string }>>([]);
const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const query = ref<{
  schoolId?: string;
  type?: string;
  status?: 'OPEN' | 'ACK' | 'CLOSED' | '';
  range?: [Date, Date] | null;
}>({ status: '', range: null });

async function load() {
  loading.value = true;
  try {
    if (!schools.value.length) schools.value = await api.aiSchools();
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (query.value.schoolId) params.schoolId = query.value.schoolId;
    if (query.value.type) params.type = query.value.type;
    if (query.value.status) params.status = query.value.status;
    if (query.value.range && query.value.range.length === 2) {
      params.start = query.value.range[0].toISOString();
      params.end = query.value.range[1].toISOString();
    }
    const res = await api.aiEvents(params);
    rows.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}
function onPage(p: number) {
  page.value = p;
  load();
}
async function onExport() {
  const params: any = {};
  if (query.value.schoolId) params.schoolId = query.value.schoolId;
  if (query.value.type) params.type = query.value.type;
  if (query.value.status) params.status = query.value.status;
  if (query.value.range && query.value.range.length === 2) {
    params.start = query.value.range[0].toISOString();
    params.end = query.value.range[1].toISOString();
  }
  const csv = await api.aiEventsExportCsv(params);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'AI-抓拍明细.csv';
  a.click();
  URL.revokeObjectURL(url);
}
onMounted(async () => {
  types.value = await (
    await fetch(`${import.meta.env.VITE_API_BASE || '/api'}/school/ai/types`)
  ).json();
  load();
});
import { watch } from 'vue';
let loadTimer: any = null;
const scheduleLoad = () => {
  if (loadTimer) clearTimeout(loadTimer);
  loadTimer = setTimeout(load, 300);
};
watch(() => query.value.schoolId, scheduleLoad);
watch(() => query.value.type, scheduleLoad);
watch(() => query.value.status, scheduleLoad);
watch(() => query.value.range, scheduleLoad, { deep: true });
</script>

<style scoped>
.toolbar {
  margin-bottom: 8px;
}
</style>
