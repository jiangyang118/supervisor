<template>
  <el-card>
    <template #header>值守管理（小组/班组）</template>
    <div style="margin-bottom: 8px; display: flex; gap: 8px">
      <el-button type="primary" @click="openCreate">新增班组</el-button>
      <el-button @click="exportCsv">导出 CSV</el-button>
    </div>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="name" label="班组" />
      <el-table-column label="成员"
        ><template #default="{ row }">{{
          (row.members || []).join(',')
        }}</template></el-table-column
      >
      <el-table-column prop="oncall" label="值守时间" />
    </el-table>
  </el-card>
  <el-dialog v-model="dlg" title="新增班组" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="成员(逗号分隔)"><el-input v-model="membersText" /></el-form-item>
      <el-form-item label="值守"><el-input v-model="form.oncall" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlg = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const dlg = ref(false);
const form = ref<any>({ name: '', members: [], oncall: '' });
const membersText = ref('');
async function load() {
  rows.value = await api.emergDuty();
}
function openCreate() {
  form.value = { name: '', members: [], oncall: '' };
  membersText.value = '';
  dlg.value = true;
}
async function save() {
  form.value.members = membersText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await api.emergDutySave(form.value);
  dlg.value = false;
  await load();
}
async function exportCsv() {
  const csv = await api.emergDutyExportCsv();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '应急值守.csv';
  a.click();
  URL.revokeObjectURL(url);
}
load();
</script>
