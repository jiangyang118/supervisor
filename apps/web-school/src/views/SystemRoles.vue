<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>角色管理</span>
        <div style="display:flex;gap:8px;align-items:center">
          <el-input v-model="qName" placeholder="角色名称" style="width:180px" @keyup.enter.native="loadRoles" />
          <el-input v-model="qRemark" placeholder="备注" style="width:180px" @keyup.enter.native="loadRoles" />
          <el-button @click="loadRoles">查询</el-button>
          <el-button type="primary" @click="openCreate">新增角色</el-button>
        </div>
      </div>
    </template>
    <el-table :data="roleRows"  border>
      <el-table-column prop="name" label="角色名称" width="220" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="创建时间" width="140">
        <template #default="{ row }">{{ dateOnly(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="140">
        <template #default="{ row }">{{ dateOnly(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button text  @click="edit(row)" type="success">编辑</el-button>
          <el-popconfirm title="确认删除该角色？" @confirm="remove(row)">
            <template #reference>
              <el-button text type="danger" >删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <RoleDialog :visible="showDialog" :role="editing" @cancel="closeDialog" @submit="onSubmitDialog" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import { ElMessage } from 'element-plus';
import RoleDialog from '../components/RoleDialog.vue';
import { getCurrentSchoolId } from '../utils/school';
import { mapMenuIdsToPermsFromTree } from '../utils/menuPerms';

const roles = ref<Array<{ id: number; schoolId: number; name: string; remark?: string; createdAt: string; updatedAt: string }>>([]);
const showDialog = ref(false);
const editing = ref<{ id?: number; name: string; remark?: string } | null>(null);
const qName = ref('');
const qRemark = ref('');
const roleRows = computed(() => roles.value);
const dateOnly = (s?: string) => (s ? String(s).slice(0, 10) : '');

async function loadRoles() {
  const sid = getCurrentSchoolId();
  const schoolId = sid ? Number(sid) : undefined;
  const query = [qName.value.trim(), qRemark.value.trim()].filter((s) => s).join(' ');
  roles.value = await api.sysRoles({ schoolId, q: query || undefined });
}
async function load() {
  await loadRoles();
}

onMounted(load);

function edit(row: any) { editing.value = { id: row.id, name: row.name, remark: row.remark }; showDialog.value = true; }
function closeDialog() { showDialog.value = false; editing.value = null; }
async function onSubmitDialog(v: { name: string; remark?: string; menuIds: string[] }) {
  try {
    if (editing.value?.id) {
      await api.sysRoleUpdate(editing.value.id, { name: v.name, remark: v.remark || '' });
      // Update permissions mapped from menu selections using backend permission list
      const tree = await api.sysPermissions();
      const perms = mapMenuIdsToPermsFromTree(v.menuIds || [], tree as any);
      await api.sysRoleSetPermissions(v.name, perms);
      ElMessage.success('角色已更新');
    } else {
      const sid = getCurrentSchoolId();
      const schoolId = sid ? Number(sid) : undefined;
      await api.sysRoleCreate(v.name, v.remark || '', schoolId);
      // Set permissions for newly created role
      const tree = await api.sysPermissions();
      const perms = mapMenuIdsToPermsFromTree(v.menuIds || [], tree as any);
      await api.sysRoleSetPermissions(v.name, perms);
      ElMessage.success('角色已创建');
    }
    showDialog.value = false; editing.value = null;
    await loadRoles();
  } catch (err: any) {
    ElMessage.error(String(err?.message || '操作失败'));
  }
}
function openCreate() { editing.value = null; showDialog.value = true; }
async function remove(row: any) {
  await api.sysRoleDelete(row.id);
  ElMessage.success('已删除角色');
  await loadRoles();
}

// mapping moved to utils/menuPerms
</script>

<style scoped>
</style>
