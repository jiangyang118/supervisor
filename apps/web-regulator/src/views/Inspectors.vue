<template>
  <el-card class="insps-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>检查人员配置</span><el-button type="primary" @click="openCreate">新增人员</el-button>
      </div>
    </template>
    <el-table :data="rows" size="small" border height="calc(100vh - 260px)">
      <el-table-column prop="name" label="姓名" width="160" />
      <el-table-column prop="region" label="区域" width="160" />
      <el-table-column prop="mobile" label="联系方式" width="180" />
      <el-table-column prop="grids" label="网格"
        ><template #default="{ row }">{{ (row.grids || []).join('，') }}</template></el-table-column
      >
      <el-table-column label="操作" width="220"
        ><template #default="{ row }"
          ><el-button size="small" @click="edit(row)">编辑</el-button
          ><el-button size="small" type="danger" @click="del(row)">删除</el-button></template
        ></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="dlg" :title="form.id ? '编辑人员' : '新增人员'" width="520px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="区域"><el-input v-model="form.region" /></el-form-item>
      <el-form-item label="联系方式"><el-input v-model="form.mobile" /></el-form-item>
      <el-form-item label="网格(逗号分隔)"><el-input v-model="gridsText" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlg = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const dlg = ref(false);
const form = ref<any>({ id: '', name: '', region: '', mobile: '', grids: [] as string[] });
const gridsText = ref('');
async function load() {
  rows.value = await api.inspInspectors();
}
function openCreate() {
  form.value = { id: '', name: '', region: '', mobile: '', grids: [] };
  gridsText.value = '';
  dlg.value = true;
}
function edit(row: any) {
  form.value = { ...row };
  gridsText.value = (row.grids || []).join(',');
  dlg.value = true;
}
async function del(row: any) {
  await api.inspInspectorDelete(row.id);
  await load();
}
async function save() {
  form.value.grids = (gridsText.value || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (form.value.id) {
    await api.inspInspectorUpdate(form.value.id, { ...form.value });
  } else {
    await api.inspInspectorCreate({ ...form.value });
  }
  dlg.value = false;
  await load();
}
onMounted(load);
</script>

<style>
.insps-card {
  min-height: 420px;
}
</style>
