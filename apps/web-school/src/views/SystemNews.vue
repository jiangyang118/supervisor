<template>
  <el-card class="sn-card">
    <template #header
      ><div style="display: flex; align-items: center; justify-content: space-between">
        <span>食安资讯发布</span>
      </div></template
    >
    <el-table :data="rows" size="small" border height="calc(100vh - 260px)">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="at" label="发布时间" width="200" />
      <el-table-column label="操作" width="140"
        ><template #default="{ row }"
          ><el-button size="small" @click="view(row)">查看</el-button></template
        ></el-table-column
      >
    </el-table>
  </el-card>
  <el-dialog v-model="dlg" title="资讯详情" width="720px">
    <h3>{{ detail?.title }}</h3>
    <div style="color: #666; margin-bottom: 8px">发布时间：{{ detail?.at }}</div>
    <div style="white-space: pre-wrap">{{ detail?.content }}</div>
    <template #footer><el-button @click="dlg = false">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const dlg = ref(false);
const detail = ref<any>(null);
async function load() {
  const res = await api.sysNews({ enabled: 'true', page: 1, pageSize: 100 });
  rows.value = res.items || [];
}
async function view(row: any) {
  detail.value = await api.sysNewsDetail(row.id);
  dlg.value = true;
}
onMounted(load);
</script>

<style>
.sn-card {
  min-height: 420px;
}
</style>
