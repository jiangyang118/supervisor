<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>公示监管（公众反馈）</span>
        <div>
          <el-button @click="onExportCsv">导出反馈</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="reply(row)">一键回复</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = {
  id: string;
  school: string;
  type: string;
  content: string;
  status: string;
  at: string;
};
const rows = ref<Row[]>([
  {
    id: 'FB-001',
    school: '示例一中',
    type: '投诉',
    content: '后厨地面湿滑',
    status: '已受理',
    at: new Date().toLocaleString(),
  },
  {
    id: 'FB-002',
    school: '示例二小',
    type: '建议',
    content: '公示更多菜品营养信息',
    status: '已回复',
    at: new Date().toLocaleString(),
  },
]);
const reply = (row: Row) => alert(`已回复 ${row.id}（演示）`);
const onExportCsv = () =>
  exportCsv('公众反馈', rows.value, {
    id: 'ID',
    school: '学校',
    type: '类型',
    content: '内容',
    status: '状态',
    at: '时间',
  });
</script>
