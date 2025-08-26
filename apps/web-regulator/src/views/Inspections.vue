<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>监督检查</span>
        <div>
          <el-button type="primary" @click="openCreate">新增检查任务</el-button>
          <el-button @click="onExportCsv">导出台账</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="任务ID" width="140" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="grid" label="网格/检查人" />
      <el-table-column prop="content" label="检查内容" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增监督检查任务" width="560px">
    <el-form :model="form" label-width="120px">
      <el-form-item label="类型">
        <el-select v-model="form.type"
          ><el-option label="日常" value="日常" /><el-option label="专项" value="专项" /><el-option
            label="双随机"
            value="双随机"
        /></el-select>
      </el-form-item>
      <el-form-item label="网格/检查人"><el-input v-model="form.grid" /></el-form-item>
      <el-form-item label="检查内容"><el-input v-model="form.content" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; type: string; grid: string; content: string; status: string; at: string };
const rows = ref<Row[]>([
  {
    id: 'CHK-001',
    type: '日常',
    grid: '一组/王五',
    content: '卫生与防鼠',
    status: '进行中',
    at: new Date().toLocaleString(),
  },
]);
const createVisible = ref(false);
const form = reactive({ type: '日常', grid: '', content: '' });
const openCreate = () => (createVisible.value = true);
const save = () => {
  rows.value.unshift({
    id: `CHK-${String(rows.value.length + 1).padStart(3, '0')}`,
    type: form.type,
    grid: form.grid,
    content: form.content,
    status: '待处理',
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('监督检查', rows.value, {
    id: 'ID',
    type: '类型',
    grid: '网格/检查人',
    content: '检查内容',
    status: '状态',
    at: '时间',
  });
</script>
