<template>
  <div style="padding:16px">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span>学校配置</span>
          <div>
            <el-button type="primary" @click="showAdd = true">新增学校</el-button>
            <el-button @click="load()">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="rows" style="width:100%">
        <el-table-column prop="id" label="ID" width="160" />
        <el-table-column prop="name" label="学校名称" />
        <el-table-column label="启用" width="120">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="(v:boolean)=>toggle(row,v)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">编辑</el-button>
            <el-popconfirm title="确认停用该学校？" @confirm="() => disable(row)">
              <template #reference>
                <el-button size="small" type="warning">停用</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" title="新增学校" width="420px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="学校名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd=false">取消</el-button>
        <el-button type="primary" @click="create">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEdit" title="编辑学校" width="420px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="ID"><el-input v-model="editForm.id" disabled /></el-form-item>
        <el-form-item label="学校名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="editForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit=false">取消</el-button>
        <el-button type="primary" @click="update">保存</el-button>
      </template>
    </el-dialog>
  </div>
  
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { api as api } from '../services/api';

type Row = { id: number; name: string; enabled: boolean };
const rows = ref<Row[]>([]);
const showAdd = ref(false);
const showEdit = ref(false);
const form = reactive<{ name: string; enabled: boolean }>({ name: '', enabled: true });
const editForm = reactive<Row>({ id: 0, name: '', enabled: true });

async function load() {
  rows.value = await api.sysSchools();
}

async function create() {
  if (!form.name.trim()) { ElMessage.error('请输入学校名称'); return; }
  await api.sysSchoolCreate({ name: form.name.trim(), enabled: form.enabled });
  ElMessage.success('已创建');
  showAdd.value = false;
  form.name = ''; form.enabled = true;
  load();
}

function edit(row: Row) {
  Object.assign(editForm, row);
  showEdit.value = true;
}

async function update() {
  await api.sysSchoolUpdate(editForm.id, { name: editForm.name, enabled: editForm.enabled });
  ElMessage.success('已保存');
  showEdit.value = false;
  load();
}

async function toggle(row: Row, v: boolean) {
  await api.sysSchoolUpdate(row.id, { enabled: v });
  ElMessage.success(v ? '已启用' : '已停用');
}

async function disable(row: Row) {
  await api.sysSchoolDelete(row.id);
  ElMessage.success('已停用');
  load();
}

onMounted(load);
</script>

<style scoped>
</style>
