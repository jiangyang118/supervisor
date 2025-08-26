<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>晨检管理</span>
        <div>
          <el-button type="primary" @click="openCreate">录入晨检</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="人员">
        <el-input v-model="filters.staff" placeholder="姓名/工号" />
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
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="staff" label="人员" />
      <el-table-column prop="temp" label="体温(℃)" width="120" />
      <el-table-column prop="result" label="结果" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="danger" text @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="录入晨检" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="人员">
        <el-input v-model="form.staff" />
      </el-form-item>
      <el-form-item label="体温(℃)">
        <el-input-number v-model="form.temp" :precision="1" :step="0.1" :min="34" :max="42" />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="form.result">
          <el-option label="正常" value="正常" />
          <el-option label="异常" value="异常" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; staff: string; temp: number; result: '正常' | '异常'; at: string };
const rows = ref<Row[]>([
  { id: 'MC-001', staff: '张三', temp: 36.6, result: '正常', at: new Date().toLocaleString() },
]);
const filters = reactive<{
  staff: string;
  result: '' | '正常' | '异常' | null;
  range: [Date, Date] | null;
}>({ staff: '', result: null, range: null });
const applyFilters = () => {};
const createVisible = ref(false);
const form = reactive({ staff: '', temp: 36.5, result: '正常' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `MC-${String(rows.value.length + 1).padStart(3, '0')}`,
    staff: form.staff,
    temp: form.temp,
    result: form.result as any,
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const remove = (id: string) => {
  rows.value = rows.value.filter((r) => r.id !== id);
};
const onExportCsv = () =>
  exportCsv('晨检台账', rows.value, {
    id: 'ID',
    staff: '人员',
    temp: '体温',
    result: '结果',
    at: '时间',
  });
</script>
