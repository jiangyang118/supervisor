<template>
  <el-card>
    <template #header>资源库</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="createdAt" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
async function load() {
  rows.value = await api.emergResources();
}
load();
</script>
