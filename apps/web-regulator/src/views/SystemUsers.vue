<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>监管端用户配置</span>
        <div>
          <el-button type="primary" @click="openCreate">新增用户</el-button>
          <el-button @click="onExportCsv">导出用户</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="displayName" label="姓名" width="180" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-switch :model-value="!!row.enabled" @change="(v:boolean)=>toggleEnabled(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="角色" min-width="260">
        <template #default="{ row }">
          <el-select
            v-model="row.roles"
            multiple
            collapse-tags
            style="width: 240px"
            placeholder="配置角色"
            @change="(vals:string[])=>saveRoles(row, vals)"
          >
            <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button text size="small" @click="edit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该账号？" @confirm="del(row)">
            <template #reference>
              <el-button text type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
          <el-button text size="small" @click="goPerms(row)">配置权限</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dlg" :title="form.id ? '编辑用户' : '新增用户'" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" :disabled="!!form.id" placeholder="登录名" />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="form.displayName" placeholder="显示名称" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.roles" multiple style="width: 260px" placeholder="选择角色">
          <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
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
import { useRouter } from 'vue-router';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const dlg = ref(false);
const form = reactive<any>({
  id: '',
  username: '',
  displayName: '',
  roles: ['ADMIN'] as string[],
});
const roleOptions = ref<string[]>([]);
const router = useRouter();
const openCreate = () => {
  Object.assign(form, { id: '', username: '', displayName: '', roles: ['ADMIN'] });
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
  // normalize
  rows.value = rows.value.map((r: any) => ({ ...r, roles: Array.isArray(r.roles) ? r.roles : [] }));
}
async function loadRoles() {
  const list = await api.sysRoles();
  roleOptions.value = list.map((r: any) => r.name).filter((x: any) => !!x);
}
async function toggleEnabled(row: any, enabled: boolean) {
  await api.sysUserUpdate(String(row.id), { enabled });
  row.enabled = enabled;
}
async function saveRoles(row: any, roles: string[]) {
  await api.sysSetUserRoles(String(row.id), roles);
}
function goPerms(row: any) {
  // Navigate to roles page, optionally preselect first role
  const role = (row.roles || [])[0];
  if (role) router.push({ path: '/system/roles', query: { role } });
  else router.push({ path: '/system/roles' });
}
onMounted(async () => { await Promise.all([loadRoles(), load()]); });
</script>
