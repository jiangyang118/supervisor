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
    <el-table :data="rows" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="displayName" label="姓名" />
      <el-table-column prop="roles" label="角色" />
    </el-table>
  </el-card>

  <el-dialog v-model="dlg" :title="form.id ? '编辑用户' : '新增用户'" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="用户名"
        ><el-input v-model="form.username" :disabled="!!form.id"
      /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="form.displayName" /></el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.roles" multiple style="width: 240px">
          <el-option label="REGULATOR" value="REGULATOR" />
          <el-option label="ADMIN" value="ADMIN" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlg = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const dlg = ref(false);
const form = reactive<any>({
  id: '',
  username: '',
  displayName: '',
  roles: ['REGULATOR'] as string[],
});
const openCreate = () => {
  Object.assign(form, { id: '', username: '', displayName: '', roles: ['REGULATOR'] });
  dlg.value = true;
};
function edit(row: any) {
  Object.assign(form, {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    roles: row.roles || [],
  });
  dlg.value = true;
}
async function save() {
  if (!form.username) return;
  if (form.id) {
    await api.sysUserUpdate(form.id, { displayName: form.displayName });
    await api.sysSetUserRoles(form.id, form.roles);
  } else {
    await api.sysUserCreate({
      username: form.username,
      displayName: form.displayName,
      roles: form.roles,
    });
  }
  dlg.value = false;
  await load();
}
async function del(row: any) {
  await api.sysUserDelete(row.id);
  await load();
}
async function load() {
  rows.value = await api.sysUsers();
}
onMounted(load);
</script>
