<template>
  <el-card>
    <template #header>预警列表</template>
    <div style="margin-bottom: 12px">该页面已合并至“预警概览”。</div>
    <el-button type="primary" @click="$router.push('/overview/alerts')">打开预警概览</el-button>
  </el-card>
</template>

<script setup lang="ts">
// Placeholder warnings page redirecting users to AlertsOverview
</script>

