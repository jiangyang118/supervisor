<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食品添加剂使用记录</span>
        <div>
          <el-button type="primary" @click="openCreate">新增记录</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="添加剂" />
      <el-table-column prop="amount" label="用量(g)" width="120" />
      <el-table-column prop="dish" label="对应菜品" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增添加剂使用记录" width="520px">
    <el-form :model="form" label-width="120px">
      <el-form-item label="添加剂">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="用量(g)">
        <el-input-number v-model="form.amount" :min="0" />
      </el-form-item>
      <el-form-item label="对应菜品">
        <el-input v-model="form.dish" />
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
type Row = { id: string; name: string; amount: number; dish: string; at: string };
const rows = ref<Row[]>([
  { id: 'AD-001', name: '食盐', amount: 10, dish: '青菜', at: new Date().toLocaleString() },
]);
const createVisible = ref(false);
const form = reactive({ name: '', amount: 0, dish: '' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `AD-${String(rows.value.length + 1).padStart(3, '0')}`,
    name: form.name,
    amount: form.amount,
    dish: form.dish,
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('添加剂使用', rows.value, {
    id: 'ID',
    name: '添加剂',
    amount: '用量',
    dish: '菜品',
    at: '时间',
  });
</script>
