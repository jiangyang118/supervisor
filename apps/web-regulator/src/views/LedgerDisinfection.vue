<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>消毒台账</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
          <el-button @click="onExportPdf">导出 PDF</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="学校">
        <el-select
          v-model="filters.schoolId"
          filterable
          clearable
          placeholder="全部学校"
          style="min-width: 220px"
        >
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="方式">
        <el-select v-model="filters.method" clearable>
          <el-option label="酒精" value="酒精" />
          <el-option label="紫外" value="紫外" />
          <el-option label="高温" value="高温" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="160" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="method" label="方式" width="120" />
      <el-table-column prop="duration" label="时长(分钟)" width="120" />
      <el-table-column prop="items" label="物品/区域" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
type Row = {
  id: string;
  school: string;
  method: string;
  duration: number;
  items: string;
  status: string;
  at: string;
};
const rows = ref<Row[]>([]);
const schools = ref<Array<{ id: string; name: string }>>([]);
const filters = reactive<{ schoolId?: string; method?: string; range: [Date, Date] | null }>({
  schoolId: undefined,
  method: undefined,
  range: null,
});
async function load() {
  const params: any = {};
  if (filters.schoolId) params.schoolId = filters.schoolId;
  if (filters.method) params.method = filters.method;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  const res = await api.ledgerDisinfection(params);
  rows.value = res.items as any;
}
const applyFilters = () => load();
onMounted(async () => {
  schools.value = await api.schools();
  await load();
});
const onExportCsv = () =>
  exportCsv('消毒台账', rows.value, {
    id: 'ID',
    school: '学校',
    method: '方式',
    duration: '时长',
    items: '物品',
    status: '状态',
    at: '时间',
  });
const onExportPdf = () => alert('导出 PDF（演示）');
</script>
