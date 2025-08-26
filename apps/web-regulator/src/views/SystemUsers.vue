<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>用户与角色</span>
        <div>
          <el-button type="primary" @click="openCreate">新增用户</el-button>
          <el-button @click="onExportCsv">导出用户</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="displayName" label="姓名" />
      <el-table-column prop="roles" label="角色" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增用户" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="form.displayName" /></el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.roles" multiple>
          <el-option label="REGULATOR" value="REGULATOR" />
          <el-option label="ADMIN" value="ADMIN" />
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
import { ref, reactive } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; username: string; displayName: string; roles: string };
const rows = ref<Row[]>([
  { id: 'U-001', username: 'admin@reg.gov', displayName: '监管管理员', roles: 'ADMIN,REGULATOR' },
]);
const createVisible = ref(false);
const form = reactive({ username: '', displayName: '', roles: ['REGULATOR'] as string[] });
const openCreate = () => (createVisible.value = true);
const save = () => {
  rows.value.unshift({
    id: `U-${String(rows.value.length + 1).padStart(3, '0')}`,
    username: form.username,
    displayName: form.displayName,
    roles: form.roles.join(','),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('系统用户', rows.value, {
    id: 'ID',
    username: '用户名',
    displayName: '姓名',
    roles: '角色',
  });
</script>
