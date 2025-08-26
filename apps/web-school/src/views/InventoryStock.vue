<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>库存与盘点</span>
        <div>
          <el-button type="primary" @click="doCheck">库存盘点</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="item" label="商品" />
      <el-table-column prop="qty" label="库存" width="120" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { item: string; qty: number; unit: string; updatedAt: string };
const rows = ref<Row[]>([
  { item: '大米', qty: 120, unit: 'kg', updatedAt: new Date().toLocaleString() },
  { item: '鸡蛋', qty: 300, unit: '枚', updatedAt: new Date().toLocaleString() },
]);
const doCheck = () => {
  alert('已触发库存盘点（演示）');
};
const onExportCsv = () =>
  exportCsv('库存盘点', rows.value, {
    item: '商品',
    qty: '库存',
    unit: '单位',
    updatedAt: '更新时间',
  });
</script>
