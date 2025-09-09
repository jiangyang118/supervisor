<template>
  <el-card>
    <template #header>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <el-button type="primary"  @click="openCreate">新增用户</el-button>
      </div>
    </template>
    <el-table :data="users"  border>
      <el-table-column prop="id" label="用户ID" width="120" />
      <el-table-column prop="displayName" label="姓名" width="120" />
      <el-table-column label="手机号/账号" min-width="180">
        <template #default="{ row }">{{ row.phone || row.username }}</template>
      </el-table-column>
      <el-table-column label="是否启用" width="120">
        <template #default="{ row }">
          <el-switch :model-value="!!row.enabled"  @change="(v:boolean)=>toggleEnabled(row,v)" />
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column prop="createdBy" label="创建人" width="100" />
      <el-table-column label="创建时间" width="120">
        <template #default="{ row }">{{ dateOnly(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="120">
        <template #default="{ row }">{{ dateOnly(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="角色" min-width="260">
        <template #default="{ row }">
          <el-select v-model="userRoles[row.id]" multiple filterable placeholder="选择角色" style="min-width:240px">
            <el-option v-for="r in roles" :key="r.name" :label="r.name" :value="r.name" />
          </el-select>
          <el-button  style="margin-left:8px" @click="saveRoles(row)">保存</el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button text  @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该用户？" @confirm="remove(row)">
            <template #reference>
              <el-button text type="danger" >删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="showDialog" :title="editing ? '编辑用户' : '新增用户'" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" >
        <el-form-item label="姓名" prop="name" required>
          <el-input v-model="form.name" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="20" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password" :required="!editing">
          <el-input v-model="form.password" show-password maxlength="64" placeholder="新增用户必填，编辑留空表示不修改" />
        </el-form-item>
        <el-form-item label="所属角色" prop="roles" required>
          <el-select v-model="form.roles" multiple filterable placeholder="选择角色" style="width:100%">
            <el-option v-for="r in roles" :key="r.name" :label="r.name" :value="r.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog=false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';

const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const userRoles = ref<Record<string, string[]>>({});
const showDialog = ref(false);
const creating = ref(false);
const formRef = ref();
const form = ref<{ name: string; phone?: string; roles: string[]; remark?: string; password?: string }>({ name: '', phone: '', roles: [], remark: '', password: '' });
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{
    validator: (_: any, v: any, cb: any) => {
      if (!editing.value && (!v || String(v).trim() === '')) return cb(new Error('请输入登录密码'));
      cb();
    },
    trigger: 'blur',
  }],
  roles: [
    { type: 'array', required: true, message: '请选择所属角色', trigger: 'change' },
    {
      validator: (_: any, value: any, cb: any) => {
        if (Array.isArray(value) && value.length > 0) return cb();
        cb(new Error('请选择所属角色'));
      },
      trigger: 'change',
    },
  ],
} as any;
const dateOnly = (s?: string) => (s ? String(s).slice(0, 10) : '');
const editing = ref<any | null>(null);

async function load() {
  const sid = getCurrentSchoolId();
  users.value = await api.sysUsers(sid);
  roles.value = await api.sysRoles();
  users.value.forEach(u => {
    userRoles.value[u.id] = [...(u.roles || [])];
  });
}

async function saveRoles(row: any) {
  await api.sysUserSetRoles(row.id, userRoles.value[row.id] || []);
  await load();
}

function openCreate() { editing.value = null; form.value = { name: '', phone: '', roles: [], remark: '', password: '' }; showDialog.value = true; }
function openEdit(row: any) {
  editing.value = row;
  form.value = { name: row.displayName, phone: row.phone || '', roles: [...(userRoles.value[row.id] || [])], remark: row.remark || '', password: '' };
  showDialog.value = true;
}
async function onSubmit() {
  const ok = await (formRef.value as any)?.validate?.().catch(() => false);
  if (!ok) return;
  creating.value = true;
  try {
    if (editing.value?.id) {
      const patch: any = { name: form.value.name.trim(), phone: form.value.phone?.trim() || undefined, remark: form.value.remark?.trim() || '' };
      // 编辑时不支持直接改密码，可在后续提供“重置密码”功能
      await api.sysUserUpdate(editing.value.id, patch);
      await api.sysUserSetRoles(editing.value.id, form.value.roles || []);
    } else {
      await api.sysUserCreate({ name: form.value.name.trim(), phone: form.value.phone?.trim() || undefined, roles: form.value.roles || [], remark: form.value.remark?.trim() || '', password: (form.value.password || '').trim(), schoolId: getCurrentSchoolId() as any });
    }
    showDialog.value = false; editing.value = null;
    await load();
  } finally {
    creating.value = false;
  }
}

async function toggleEnabled(row: any, v: boolean) {
  await api.sysUserUpdate(row.id, { enabled: v });
  await load();
}

async function remove(row: any) {
  await api.sysUserDelete(row.id);
  await load();
}

onMounted(load);
</script>

<style scoped></style>
