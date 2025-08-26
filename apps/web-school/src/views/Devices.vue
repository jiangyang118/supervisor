<template>
  <el-card>
    <template #header>已接入设备信息</template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="设备ID" width="140" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="status" label="状态" width="120" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const rows = ref([
  { id: 'GW-001', type: '网关', name: '主网关', status: '在线' },
  { id: 'CAM-001', type: '摄像头', name: '后厨-操作台', status: '在线' },
  { id: 'SCALE-001', type: '留样秤', name: 'A-1', status: '离线' },
]);
</script>
