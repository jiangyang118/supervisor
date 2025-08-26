<template>
  <el-card>
    <template #header>与监管端关联申请</template>
    <el-form :model="form" label-width="120px" style="max-width: 640px">
      <el-form-item label="监管单位"><el-input v-model="form.org" /></el-form-item>
      <el-form-item label="联系人"><el-input v-model="form.contact" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      <el-form-item><el-button type="primary" @click="submit">提交申请</el-button></el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const form = reactive({ org: '示例市市场监管局', contact: '李监管', remark: '' });
const submit = () => alert('已提交（演示）');
</script>
