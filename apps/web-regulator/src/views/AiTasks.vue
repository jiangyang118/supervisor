<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>巡查任务</span>
        <div>
          <el-button type="primary" @click="openCreate">发布任务</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部">
          <el-option label="待处理" value="待处理" />
          <el-option label="进行中" value="进行中" />
          <el-option label="已完成" value="已完成" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="任务ID" width="140" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="camera" label="摄像头/通道" />
      <el-table-column prop="action" label="动作" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="dueAt" label="截止" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="发布巡查任务" width="560px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="学校"><el-input v-model="form.school" /></el-form-item>
      <el-form-item label="摄像头/通道"><el-input v-model="form.camera" /></el-form-item>
      <el-form-item label="动作">
        <el-select v-model="form.action">
          <el-option label="巡查抓拍" value="巡查抓拍" />
          <el-option label="语音提醒" value="语音提醒" />
          <el-option label="复核核验" value="复核核验" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止">
        <el-date-picker v-model="form.dueAt" type="datetime" />
      </el-form-item>
      <el-form-item label="指派给"><el-input v-model="form.assignTo" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = {
  id: string;
  school: string;
  camera: string;
  action: string;
  status: string;
  dueAt: string;
};
const rows = ref<Row[]>([
  {
    id: 'TASK-001',
    school: '示例一中',
    camera: '1# 食堂-后厨通道',
    action: '巡查抓拍',
    status: '待处理',
    dueAt: new Date(Date.now() + 3600e3).toLocaleString(),
  },
  {
    id: 'TASK-002',
    school: '示例二小',
    camera: '2# 食堂-操作台',
    action: '语音提醒',
    status: '进行中',
    dueAt: new Date(Date.now() + 7200e3).toLocaleString(),
  },
]);
const filters = reactive<{ status: string | undefined; range: [Date, Date] | null }>({
  status: undefined,
  range: null,
});
const applyFilters = () => {};
const createVisible = ref(false);
const form = reactive({
  school: '',
  camera: '',
  action: '巡查抓拍',
  dueAt: new Date(),
  assignTo: '',
});
const openCreate = () => (createVisible.value = true);
const save = () => {
  rows.value.unshift({
    id: `TASK-${String(rows.value.length + 1).padStart(3, '0')}`,
    school: form.school,
    camera: form.camera,
    action: form.action,
    status: '待处理',
    dueAt: (form.dueAt as any)?.toLocaleString?.() ?? String(form.dueAt),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('巡查任务', rows.value, {
    id: '任务ID',
    school: '学校',
    camera: '摄像头',
    action: '动作',
    status: '状态',
    dueAt: '截止',
  });
</script>
