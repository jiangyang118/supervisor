<template>
  <el-card>
    <template #header>用户/角色/RBAC</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="displayName" label="姓名" />
      <el-table-column prop="roles" label="角色" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  { id: 'U-100', username: 'principal@school.cn', displayName: '校长', roles: 'SCHOOL,ADMIN' },
]);
</script>
