<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>留样台账</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="学校">
        <el-input v-model="filters.school" />
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="weight" label="重量(g)" width="120" />
      <el-table-column prop="duration" label="时长(h)" width="120" />
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
  sample: string;
  weight: number;
  duration: number;
  at: string;
};
const rows = ref<Row[]>([
  {
    id: 'SP-001',
    school: '示例一中',
    sample: '午餐菜品A',
    weight: 150,
    duration: 48,
    at: new Date().toLocaleString(),
  },
]);
const filters = reactive<{ school: string; range: [Date, Date] | null }>({
  school: '',
  range: null,
});
const applyFilters = () => {};
const onExportCsv = () =>
  exportCsv('留样台账-监管', rows.value, {
    id: 'ID',
    school: '学校',
    sample: '样品',
    weight: '重量',
    duration: '时长',
    at: '时间',
  });
</script>
