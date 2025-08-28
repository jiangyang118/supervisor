<template>
  <el-card>
    <template #header>事件/演练管理</template>
    <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
      <el-select v-model="type" placeholder="类型" clearable style="width: 140px">
        <el-option label="事件" value="事件" />
        <el-option label="演练" value="演练" />
      </el-select>
      <el-select v-model="status" placeholder="状态" clearable style="width: 140px">
        <el-option label="未接警" value="未接警" />
        <el-option label="已接警" value="已接警" />
        <el-option label="已消警" value="已消警" />
      </el-select>
      <el-button @click="load">查询</el-button>
      <el-button @click="exportCsv">导出 CSV</el-button>
    </div>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-button v-if="row.status === '未接警'" size="small" type="primary" @click="accept(row)"
            >接警</el-button
          >
          <el-button v-if="row.status !== '已消警'" size="small" type="danger" @click="clearEv(row)"
            >消警</el-button
          >
          <el-select
            v-model="selectPlan[row.id]"
            placeholder="选择预案"
            size="small"
            style="width: 160px; margin-left: 8px"
          >
            <el-option v-for="p in plans" :key="p.id" :label="p.title" :value="p.id" />
          </el-select>
          <el-button size="small" @click="startPlan(row)">启动预案</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const type = ref('');
const status = ref('');
const plans = ref<any[]>([]);
const selectPlan = reactive<Record<string, string | undefined>>({});
async function load() {
  rows.value = await api.emergEvents({
    type: type.value as any,
    status: status.value || undefined,
  });
  plans.value = await api.emergPlans();
}
async function accept(row: any) {
  await api.emergAccept(row.id);
  await load();
}
async function clearEv(row: any) {
  await api.emergClear(row.id);
  await load();
}
async function startPlan(row: any) {
  const pid = selectPlan[row.id];
  if (!pid) return;
  await api.emergStartPlan(row.id, pid);
  await load();
}
async function exportCsv() {
  const csv = await api.emergEventsExportCsv({
    type: type.value as any,
    status: status.value || undefined,
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '应急事件_演练.csv';
  a.click();
  URL.revokeObjectURL(url);
}
load();
</script>
