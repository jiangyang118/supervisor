<template>
  <el-card>
    <template #header>明厨亮灶 - 通道配置</template>
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="通道ID" width="120" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="enabled" label="启用" width="120">
        <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([{ id: 'S-CH-001', name: '后厨-操作台', enabled: true }]);
</script>
