<template>
  <el-card>
    <template #header>监管单位信息</template>
    <el-form :model="form" label-width="120px" style="max-width: 640px">
      <el-form-item label="单位名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="联系人"><el-input v-model="form.contact" /></el-form-item>
      <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const form = reactive({
  name: '示例市市场监管局',
  contact: '李监管',
  phone: '010-123456',
  address: '示例市XX路100号',
});
const save = () => alert('已保存（演示）');
</script>
