<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>供应商管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增供应商</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="license" label="营业执照号" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增供应商" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="form.phone" />
      </el-form-item>
      <el-form-item label="营业执照号">
        <el-input v-model="form.license" />
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
type Row = { id: string; name: string; phone: string; license: string };
const rows = ref<Row[]>([
  { id: 'SP-001', name: '示例供应商', phone: '13800000000', license: 'LIC-123456' },
]);
const createVisible = ref(false);
const form = reactive({ name: '', phone: '', license: '' });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `SP-${String(rows.value.length+1).padStart(3,'0')}`, name: form.name, phone: form.phone, license: form.license });
  createVisible.value = false;
};
const onExportCsv = () => exportCsv('供应商', rows.value, { id:'ID', name:'名称', phone:'电话', license:'营业执照号' });
</script>

