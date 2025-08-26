<template>
  <el-card>
    <template #header>指挥调度（视频会议/任务）</template>
    <el-form :inline="true" :model="form">
      <el-form-item label="会议主题"><el-input v-model="form.topic" /></el-form-item>
      <el-form-item><el-button type="primary" @click="start">发起会议</el-button></el-form-item>
    </el-form>
    <el-empty description="会中控制/共享/邀请（演示占位）" />
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const form = reactive({ topic: '校园食安应急会议' });
const start = () => alert('已发起会议（演示）');
</script>
