<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>晨检台账</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="学校">
        <el-input v-model="filters.school" />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="filters.result" clearable>
          <el-option label="正常" value="正常" />
          <el-option label="异常" value="异常" />
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
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="staff" label="人员" />
      <el-table-column prop="temp" label="体温(℃)" width="120" />
      <el-table-column prop="result" label="结果" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; school: string; staff: string; temp: number; result: string; at: string };
const rows = ref<Row[]>([
  {
    id: 'MC-001',
    school: '示例一中',
    staff: '张三',
    temp: 36.6,
    result: '正常',
    at: new Date().toLocaleString(),
  },
]);
const filters = reactive<{
  school: string;
  result: '' | '正常' | '异常' | null;
  range: [Date, Date] | null;
}>({ school: '', result: null, range: null });
const applyFilters = () => {};
const onExportCsv = () =>
  exportCsv('晨检台账-监管', rows.value, {
    id: 'ID',
    school: '学校',
    staff: '人员',
    temp: '体温',
    result: '结果',
    at: '时间',
  });
</script>
