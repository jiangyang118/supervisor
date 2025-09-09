<template>
  <el-card>
    <template #header>角色管理</template>
    <div style="margin-bottom:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <el-input v-model="q" placeholder="搜索角色名称/备注" clearable style="width: 220px" @keyup.enter.native="loadRoles" />
      <el-button @click="loadRoles">查询</el-button>
      <el-divider direction="vertical" />
      <el-button type="primary" @click="openCreate">新增角色</el-button>
    </div>
    <el-table :data="roleRows" size="small" border>
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
          <el-button text size="small" @click="edit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该角色？" @confirm="remove(row)">
            <template #reference>
              <el-button text type="danger" size="small">删除</el-button>
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

const roles = ref<Array<{ id: number; schoolId: number; name: string; remark?: string; createdAt: string; updatedAt: string }>>([]);
const showDialog = ref(false);
const editing = ref<{ id?: number; name: string; remark?: string } | null>(null);
const q = ref('');
const roleRows = computed(() => roles.value);
const dateOnly = (s?: string) => (s ? String(s).slice(0, 10) : '');

async function loadRoles() {
  const sid = getCurrentSchoolId();
  const schoolId = sid ? Number(sid) : undefined;
  roles.value = await api.sysRoles({ schoolId, q: q.value.trim() || undefined });
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
      // Update permissions mapped from selected menus
      const perms = mapMenuIdsToPerms(v.menuIds);
      await api.sysRoleSetPermissions(v.name, perms);
      ElMessage.success('角色已更新');
    } else {
      const sid = getCurrentSchoolId();
      const schoolId = sid ? Number(sid) : undefined;
      await api.sysRoleCreate(v.name, v.remark || '', schoolId);
      // Set permissions for newly created role
      const perms = mapMenuIdsToPerms(v.menuIds);
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

function mapMenuIdsToPerms(ids: string[]): string[] {
  const set = new Set<string>();
  for (const id of ids || []) {
    if (id.startsWith('store_')) set.add('inventory.*');
    else if (id.startsWith('daily_')) set.add('daily.*');
    else if (id.startsWith('hr_')) set.add('hr.*');
    else if (id.startsWith('video_') || id.startsWith('check_')) set.add('bright.*');
    else if (id.startsWith('home_')) set.add('overview.*');
    else if (id.startsWith('env_')) set.add('env.*');
    else if (id.startsWith('public_')) set.add('public.*');
    else if (id.startsWith('sys_')) set.add('system.*');
  }
  return Array.from(set);
}
</script>

<style scoped>
</style>
