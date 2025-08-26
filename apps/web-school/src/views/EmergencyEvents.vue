<template>
  <el-card>
    <template #header>事件/演练管理</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  { id: 'EV-001', type: '事件', status: '已接警', at: new Date().toLocaleString() },
]);
</script>
