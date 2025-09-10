<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <span>学校账号配置</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <el-select v-model="query.schoolId" clearable placeholder="按学校筛选" style="width:220px">
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-input v-model="query.q" placeholder="搜索用户名/姓名/手机号" clearable style="width:220px" @keyup.enter.native="loadList" />
          <el-button @click="loadList">查询</el-button>
          <el-button type="primary" @click="showCreateDialog=true">新增账号</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="24">
        <el-card class="box">
          <template #header>已有学校账号</template>
          <el-table :data="rows" border size="small">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" width="140" />
            <el-table-column prop="displayName" label="姓名" width="140" />
            <el-table-column prop="phone" label="手机号" width="140" />
            <el-table-column prop="schoolName" label="学校" width="160" />
            
            <el-table-column label="启用" width="90">
              <template #default="{ row }">
                <el-switch :model-value="!!row.enabled" @change="(v:boolean)=>update(row,{enabled:v})" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button text size="small" @click="openEdit(row)">编辑</el-button>
                <el-popconfirm title="确认删除该账号？" @confirm="remove(row)">
                  <template #reference>
                    <el-button text type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <!-- 新增账号弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新增学校账号" width="560px" @closed="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px" style="max-width:520px">
        <el-form-item label="学校" prop="schoolId">
          <el-select v-model="form.schoolId" filterable placeholder="请选择学校" style="width:100%">
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="用于登录的账号名" />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="form.displayName" placeholder="显示名称（可选）" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="预留手机号（可选）" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog=false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onCreate">创建</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showDialog" title="编辑学校账号" width="520px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="显示名称">
          <el-input v-model="editForm.displayName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="学校">
          <el-select v-model="editForm.schoolId" filterable placeholder="请选择学校" style="width:100%">
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog=false">取消</el-button>
        <el-button type="primary" @click="onUpdate">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
 </template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '../services/api';
import type { FormInstance, FormRules } from 'element-plus';

const schools = ref<Array<{id:number; name:string}>>([]);
const query = ref<{ schoolId?: number; q?: string }>({});
const rows = ref<any[]>([]);
const form = ref<{ schoolId: number | null; username: string; displayName?: string; phone?: string; password?: string }>({ schoolId: null, username: '', password: '' });
const formRef = ref<FormInstance>();
const loading = ref(false);
const showCreateDialog = ref(false);
const showDialog = ref(false);
const editForm = ref<{ id?: number; displayName?: string; phone?: string; schoolId?: number }>({} as any);
// Success modal removed per requirement

const rules: FormRules = {
  schoolId: [{ required: true, message: '请选择学校', trigger: 'change' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function loadSchools() {
  try {
    const rows = await api.sysSchools();
    schools.value = rows.map((r: any) => ({ id: Number(r.id), name: r.name }));
  } catch (e: any) {
    ElMessage.error(e?.message || '加载学校列表失败');
  }
}

async function onCreate() {
  try {
    if (formRef.value) {
      const ok = await formRef.value.validate().catch(() => false);
      if (!ok) return;
    }
    loading.value = true;
    // clear any prior state
    const body = { schoolId: Number(form.value.schoolId), username: form.value.username.trim(), displayName: form.value.displayName?.trim(), phone: form.value.phone?.trim(), password: form.value.password?.trim() } as any;
    await api.sysCreateSchoolAccount(body);
    ElMessage.success('创建成功');
    showCreateDialog.value = false;
    await loadList();
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

async function loadList() {
  rows.value = await api.sysSchoolAccountList({ schoolId: query.value.schoolId, q: (query.value.q || '').trim() || undefined });
}

function openEdit(row: any) {
  editForm.value = { id: row.id, displayName: row.displayName, phone: row.phone, schoolId: row.schoolId } as any;
  showDialog.value = true;
}
async function onUpdate() {
  await api.sysSchoolAccountUpdate(editForm.value.id!, { displayName: editForm.value.displayName, phone: editForm.value.phone, schoolId: editForm.value.schoolId });
  ElMessage.success('已更新');
  showDialog.value = false; editForm.value = {} as any;
  await loadList();
}
async function update(row: any, patch: any) {
  await api.sysSchoolAccountUpdate(row.id, patch);
  ElMessage.success('已保存');
}
async function remove(row: any) {
  await api.sysSchoolAccountDelete(row.id);
  ElMessage.success('已删除');
  await loadList();
}

onMounted(async () => { await loadSchools(); await loadList(); });

function resetForm() {
  if (formRef.value) formRef.value.clearValidate?.();
  form.value = { schoolId: null, username: '', displayName: '', phone: '', password: '' } as any;
}
</script>

<style scoped>
code { background: #f5f5f5; padding: 1px 6px; border-radius: 4px; }
</style>
