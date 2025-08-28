<template>
  <el-card>
    <template #header>视频监控（学校下摄像头流）</template>
    <el-table :data="cameras" size="small" border>
      <el-table-column prop="id" label="通道ID" width="160" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }"
          ><el-button size="small" @click="preview(row)">预览</el-button></template
        >
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
type Cam = { id: string; name: string };
const cameras = ref<Cam[]>([]);
async function load() {
  cameras.value = await api.emergCameras();
}
function preview(row: Cam) {
  alert(`预览 ${row.name}（演示）`);
}
load();
</script>
