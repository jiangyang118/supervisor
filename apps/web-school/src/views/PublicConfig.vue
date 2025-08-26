<template>
  <el-card>
    <template #header>公示项配置</template>
    <el-form label-width="160px" :model="cfg" style="max-width: 720px">
      <el-form-item label="是否公开直播"><el-switch v-model="cfg.live" /></el-form-item>
      <el-form-item label="用户评价"><el-switch v-model="cfg.rating" /></el-form-item>
      <el-form-item label="机构证件"><el-switch v-model="cfg.orgCert" /></el-form-item>
      <el-form-item label="人员证件"><el-switch v-model="cfg.staffCert" /></el-form-item>
      <el-form-item label="食安等级"><el-switch v-model="cfg.level" /></el-form-item>
      <el-form-item label="食材溯源信息"><el-switch v-model="cfg.trace" /></el-form-item>
      <el-form-item label="是否公开营养菜品"><el-switch v-model="cfg.menu" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const cfg = reactive({
  live: true,
  rating: true,
  orgCert: true,
  staffCert: true,
  level: true,
  trace: true,
  menu: true,
});
const save = () => alert('已保存（演示）');
</script>
