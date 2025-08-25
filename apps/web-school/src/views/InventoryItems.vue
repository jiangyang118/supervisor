<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>商品管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增商品</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="category" label="分类" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增商品" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="form.unit" />
      </el-form-item>
      <el-form-item label="分类">
        <el-input v-model="form.category" />
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
type Row = { id: string; name: string; unit: string; category: string };
const rows = ref<Row[]>([
  { id: 'IT-001', name: '大米', unit: 'kg', category: '主食' },
]);
const createVisible = ref(false);
const form = reactive({ name: '', unit: 'kg', category: '' });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `IT-${String(rows.value.length+1).padStart(3,'0')}`, name: form.name, unit: form.unit, category: form.category });
  createVisible.value = false;
};
const onExportCsv = () => exportCsv('商品管理', rows.value, { id:'ID', name:'名称', unit:'单位', category:'分类' });
</script>

