<template>
  <el-card>
    <template #header>隐患排查管理</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="隐患ID" width="120" />
      <el-table-column prop="desc" label="描述" />
      <el-table-column prop="task" label="整改任务" />
      <el-table-column prop="status" label="状态" width="120" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  { id: 'RK-001', desc: '冷藏区温度偏高', task: '调整设定并复核', status: '待整改' },
]);
</script>
