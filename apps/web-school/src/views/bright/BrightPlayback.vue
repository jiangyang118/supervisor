<template>
  <el-card>
    <template #header>明厨亮灶 - 回放</template>
    <el-form :inline="true" :model="query">
      <el-form-item label="通道"><el-input v-model="query.camera" /></el-form-item>
      <el-form-item label="时间"
        ><el-date-picker v-model="query.range" type="datetimerange"
      /></el-form-item>
      <el-form-item><el-button @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-empty description="回放结果占位" />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const query = ref<{ camera: string; range: [Date, Date] | null }>({ camera: '', range: null });
const search = () => alert('查询回放（演示）');
</script>
