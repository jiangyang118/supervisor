<template>
  <el-card>
    <template #header>值守管理（小组/班组）</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="group" label="小组" />
      <el-table-column prop="members" label="成员" />
      <el-table-column prop="oncall" label="值守时间" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([{ group: '一组', members: '张三,李四', oncall: '本周' }]);
</script>
