<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>入库登记</span>
        <div>
          <el-button type="primary" @click="openCreate">新增入库</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="item" label="商品" />
      <el-table-column prop="quantity" label="数量" width="120" />
      <el-table-column prop="supplier" label="供应商" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增入库" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="商品">
        <el-input v-model="form.item" />
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number v-model="form.quantity" :min="1" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-input v-model="form.supplier" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible=false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; item: string; quantity: number; supplier: string; at: string };
const rows = ref<Row[]>([
  { id: 'IN-001', item: '大米', quantity: 50, supplier: '示例供应商', at: new Date().toLocaleString() },
]);
const createVisible = ref(false);
const form = reactive({ item: '', quantity: 1, supplier: '' });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `IN-${String(rows.value.length+1).padStart(3,'0')}`, item: form.item, quantity: form.quantity, supplier: form.supplier, at: new Date().toLocaleString() });
  createVisible.value = false;
};
const onExportCsv = () => exportCsv('入库登记', rows.value, { id:'ID', item:'商品', quantity:'数量', supplier:'供应商', at:'时间' });
</script>

