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
import { reactive, onMounted } from 'vue';
import { api } from '../services/api';
const form = reactive<any>({ name: '', contact: '', phone: '', address: '' });
async function load() {
  Object.assign(form, await api.sysInfoGet());
}
async function save() {
  await api.sysInfoSave(form);
}
onMounted(load);
</script>
