<template>
  <el-card>
    <template #header>移动端扫码</template>
    <el-table :data="apps" size="small" border>
      <el-table-column prop="platform" label="平台" width="140" />
      <el-table-column prop="version" label="版本" width="120" />
      <el-table-column prop="url" label="下载链接" />
      <el-table-column label="操作" width="260"
        ><template #default="{ row }">
          <a :href="row.url" target="_blank"
            ><el-button size="small" type="primary">下载</el-button></a
          >
          <img
            :src="qr(row.url)"
            alt="QR"
            style="width: 90px; height: 90px; margin-left: 8px"
          /> </template
      ></el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
const apps = ref<any[]>([]);
async function load() {
  apps.value = await api.sysApps();
}
function qr(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`;
}
load();
</script>
