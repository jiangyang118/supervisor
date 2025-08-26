<template>
  <el-card>
    <template #header>预案管理</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="预案ID" width="120" />
      <el-table-column prop="title" label="名称" />
      <el-table-column prop="flow" label="流程/行动" />
      <el-table-column prop="law" label="法规" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  { id: 'PLAN-001', title: '食品中毒应急预案', flow: '上报-处置-复盘', law: '食品安全法' },
]);
</script>
