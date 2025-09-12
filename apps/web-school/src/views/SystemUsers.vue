<template>
  <el-card>
    <template #header>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content: space-between;">
        <span>用户管理</span>
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
      <el-table-column prop="createdBy" label="创建人" width="140" />
      <el-table-column label="创建时间" width="140">
        <template #default="{ row }">{{ dateOnly(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="140">
        <template #default="{ row }">{{ dateOnly(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button text  @click="openEdit(row)" type="success">编辑</el-button>
          <el-popconfirm title="确认删除该用户？" @confirm="remove(row)">
            <template #reference>
              <el-button text type="danger" >删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  <el-dialog v-model="showDialog" :title="editing ? '编辑用户' : '新增用户'" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="96px" >
        <el-form-item label="姓名" prop="name" required>
          <el-input v-model="form.name" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="20" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password" :required="!editing">
          <el-input v-model="form.password" show-password maxlength="64" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="所属角色" prop="roles" required>
          <el-select v-model="form.roles" multiple filterable placeholder="选择角色" style="width:100%">
            <el-option v-for="r in roles" :key="r.name" :label="r.name" :value="r.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-divider v-if="editing" content-position="left">系统信息</el-divider>
        <el-form-item v-if="editing" label="创建人">
          <el-input v-model="form.createdBy" disabled />
        </el-form-item>
        <el-form-item v-if="editing" label="创建时间">
          <el-input :model-value="dateOnly(form.createdAt)" disabled />
        </el-form-item>
        <el-form-item v-if="editing" label="更新时间">
          <el-input :model-value="dateOnly(form.updatedAt)" disabled />
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
import { ElMessage } from 'element-plus';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';

const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const showDialog = ref(false);
const creating = ref(false);
const formRef = ref();
const form = ref<{ name: string; phone?: string; roles: string[]; remark?: string; password?: string; createdBy?: string; createdAt?: string; updatedAt?: string }>({ name: '', phone: '', roles: [], remark: '', password: '', createdBy: '', createdAt: '', updatedAt: '' });
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
}

// 角色列已移除：如需调整角色，请在用户编辑或其他入口处理

function openCreate() { editing.value = null; form.value = { name: '', phone: '', roles: [], remark: '', password: '', createdBy: '', createdAt: '', updatedAt: '' }; showDialog.value = true; }
function openEdit(row: any) {
  editing.value = row;
  // Use roles from row (API returns array). Fallback to empty array.
  form.value = { name: row.displayName, phone: row.phone || '', roles: Array.isArray(row.roles) ? [...row.roles] : [], remark: row.remark || '', password: '', createdBy: row.createdBy || '', createdAt: row.createdAt || '', updatedAt: row.updatedAt || '' };
  showDialog.value = true;
}
async function onSubmit() {
  const ok = await (formRef.value as any)?.validate?.().catch(() => false);
  if (!ok) return;
  creating.value = true;
  try {
    if (editing.value?.id) {
      const patch: any = { name: form.value.name.trim(), phone: form.value.phone?.trim() || undefined, remark: form.value.remark?.trim() || '' };
      await api.sysUserUpdate(editing.value.id, patch);
      await api.sysUserSetRoles(editing.value.id, form.value.roles || []);
      ElMessage.success('用户已更新');
    } else {
      await api.sysUserCreate({ name: form.value.name.trim(), phone: form.value.phone?.trim() || undefined, roles: form.value.roles || [], remark: form.value.remark?.trim() || '', password: (form.value.password || '').trim(), schoolId: getCurrentSchoolId() as any });
      ElMessage.success('用户已创建');
    }
    showDialog.value = false; editing.value = null;
    await load();
  } catch (e: any) {
    ElMessage.error(String(e?.message || '操作失败'));
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
