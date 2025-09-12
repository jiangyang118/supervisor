<template>
  <el-card>
    <template #header>移动端扫码</template>
    <el-table :data="apps"  border>
      <el-table-column prop="platform" label="平台" width="140" />
      <el-table-column prop="version" label="版本" width="120" />
      <el-table-column prop="url" label="下载链接" />
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <template v-if="pending(row)">
            <el-tag type="warning" effect="plain">待上线</el-tag>
          </template>
          <template v-else>
            <a :href="row.url" target="_blank">
              <el-button type="primary">下载</el-button>
            </a>
            <img :src="qr(row.url)" alt="QR" style="width: 90px; height: 90px; margin-left: 8px" />
          </template>
        </template>
      </el-table-column>
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
function pending(row: any) {
  const url = String(row?.url || '').trim();
  if (!url) return true;
  // Heuristics: placeholder URLs are treated as not yet available
  if (/example\.com/i.test(url)) return true;
  if (/idx{4,}/i.test(url) || /idx+/.test(url)) return true;
  if (/idxxxx/i.test(url)) return true;
  return false;
}
load();
</script>
