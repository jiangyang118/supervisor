<template>
  <el-card>
    <template #header>公众投诉/建议/表扬/评论处理</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }"
          ><el-button size="small" @click="reply(row)">一键回复</el-button></template
        >
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  {
    id: 'FB-100',
    type: '建议',
    content: '加强透明厨房展示',
    status: '待处理',
    at: new Date().toLocaleString(),
  },
]);
const reply = (r: any) => alert(`已回复 ${r.id}（演示）`);
</script>
