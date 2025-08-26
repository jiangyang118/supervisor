<template>
  <el-card>
    <template #header>食安指数</template>
    <el-table :data="ranking" size="small" border>
      <el-table-column prop="metric" label="指标" />
      <el-table-column prop="value" label="数值" width="120" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const ranking = ref([
  { metric: '综合得分', value: 95 },
  { metric: 'AI 行为规范', value: 92 },
]);
</script>
