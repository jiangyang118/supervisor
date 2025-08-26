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
        <el-input v-model="filters.school" placeholder="学校名称" />
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
        <el-button @click="applyFilters">查询</el-button>
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
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = {
  id: string;
  school: string;
  method: string;
  duration: number;
  items: string;
  status: string;
  at: string;
};
const rows = ref<Row[]>([
  {
    id: 'DS-001',
    school: '示例一中',
    method: '酒精',
    duration: 30,
    items: '案板/台面',
    status: '正常',
    at: new Date().toLocaleString(),
  },
  {
    id: 'DS-002',
    school: '示例二小',
    method: '紫外',
    duration: 15,
    items: '餐具',
    status: '正常',
    at: new Date().toLocaleString(),
  },
]);
const filters = reactive<{
  school: string;
  method: string | undefined;
  range: [Date, Date] | null;
}>({ school: '', method: undefined, range: null });
const applyFilters = () => {};
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
