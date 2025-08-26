<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>留样记录</span>
        <div>
          <el-button type="primary" @click="openCreate">新建</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="样品">
        <el-input v-model="filters.sample" />
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
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="weight" label="重量(g)" width="120" />
      <el-table-column prop="cabinet" label="留样柜" />
      <el-table-column prop="duration" label="时长(h)" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建留样记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="样品">
        <el-input v-model="form.sample" />
      </el-form-item>
      <el-form-item label="重量(g)">
        <el-input-number v-model="form.weight" :min="1" />
      </el-form-item>
      <el-form-item label="留样柜">
        <el-input v-model="form.cabinet" />
      </el-form-item>
      <el-form-item label="时长(h)">
        <el-input-number v-model="form.duration" :min="1" />
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
type Row = {
  id: string;
  sample: string;
  weight: number;
  cabinet: string;
  duration: number;
  at: string;
};
const rows = ref<Row[]>([
  {
    id: 'SP-001',
    sample: '午餐菜品A',
    weight: 150,
    cabinet: 'A-1',
    duration: 48,
    at: new Date().toLocaleString(),
  },
]);
const filters = reactive<{ sample: string; range: [Date, Date] | null }>({
  sample: '',
  range: null,
});
const applyFilters = () => {};
const createVisible = ref(false);
const form = reactive({ sample: '', weight: 100, cabinet: '', duration: 48 });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `SP-${String(rows.value.length + 1).padStart(3, '0')}`,
    sample: form.sample,
    weight: form.weight,
    cabinet: form.cabinet,
    duration: form.duration,
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('留样记录', rows.value, {
    id: 'ID',
    sample: '样品',
    weight: '重量',
    cabinet: '留样柜',
    duration: '时长',
    at: '时间',
  });
</script>
