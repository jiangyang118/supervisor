<template>
  <el-card>
    <template #header>预案管理</template>
    <div style="margin-bottom: 8px; display: flex; gap: 8px">
      <el-button type="primary" @click="openCreate">新增预案</el-button>
      <el-button @click="exportCsv">导出 CSV</el-button>
    </div>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="预案ID" width="120" />
      <el-table-column prop="title" label="名称" />
      <el-table-column prop="flow" label="流程/行动" />
      <el-table-column prop="law" label="法规" />
    </el-table>
  </el-card>
  <el-dialog v-model="dlg" title="新增预案" width="600px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="名称"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="流程"><el-input v-model="form.flow" /></el-form-item>
      <el-form-item label="法规"><el-input v-model="form.law" /></el-form-item>
      <el-form-item label="行动(逗号分隔)"><el-input v-model="actionsText" /></el-form-item>
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
const form = ref<any>({ title: '', flow: '', law: '' });
const actionsText = ref('启动视频会议,下发任务');
async function load() {
  rows.value = await api.emergPlans();
}
function openCreate() {
  form.value = { title: '', flow: '', law: '' };
  actionsText.value = '';
  dlg.value = true;
}
async function save() {
  await api.emergPlanCreate({
    ...form.value,
    actions: actionsText.value
      ? actionsText.value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  });
  dlg.value = false;
  await load();
}
async function exportCsv() {
  const csv = await api.emergPlansExportCsv();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '应急预案.csv';
  a.click();
  URL.revokeObjectURL(url);
}
load();
</script>
