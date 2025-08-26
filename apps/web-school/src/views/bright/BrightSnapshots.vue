<template>
  <el-card>
    <template #header>明厨亮灶 - 快照留存</template>
    <el-table :data="snaps" size="small" border>
      <el-table-column prop="id" label="快照ID" width="120" />
      <el-table-column prop="camera" label="通道" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const snaps = ref([{ id: 'SN-001', camera: 'S-CH-001', at: new Date().toLocaleString() }]);
</script>
