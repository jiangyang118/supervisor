<template>
  <el-card>
    <template #header>学校食堂信息维护</template>
    <el-form :model="form" label-width="120px" style="max-width: 640px">
      <el-form-item label="食堂名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="负责人"><el-input v-model="form.manager" /></el-form-item>
      <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
      <el-form-item><el-button type="primary" @click="save">保存</el-button></el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const form = reactive({ name: '1号食堂', manager: '王主管', phone: '1380000', address: '校园内' });
const save = () => alert('已保存（演示）');
</script>
