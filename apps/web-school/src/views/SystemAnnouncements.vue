<template>
  <el-card>
    <template #header>公告公文</template>
    <el-form :model="form" label-width="96px" style="max-width: 720px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" /></el-form-item>
      <el-form-item><el-button type="primary" @click="save">发布</el-button></el-form-item>
    </el-form>
    <el-divider />
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
const form = reactive({ title: '', content: '' });
const rows = ref([{ id: 'AN-001', title: '食品安全周活动', at: new Date().toLocaleString() }]);
const save = () => {
  rows.value.unshift({
    id: `AN-${String(rows.value.length + 1).padStart(3, '0')}`,
    title: form.title,
    at: new Date().toLocaleString(),
  });
  alert('已发布（演示）');
};
</script>
