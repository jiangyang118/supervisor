<template>
  <el-card>
    <template #header>资源库</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="分类" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([{ id: 'RS-001', type: '视频', name: '操作规范', category: '培训' }]);
</script>
