<template>
  <el-card>
    <template #header>餐次设置</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="name" label="餐次" />
      <el-table-column prop="time" label="时间段" />
      <el-table-column prop="enabled" label="启用" width="120">
        <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  { name: '早餐', time: '07:00-08:00', enabled: true },
  { name: '午餐', time: '11:30-12:30', enabled: true },
  { name: '晚餐', time: '17:30-18:30', enabled: false },
]);
</script>
