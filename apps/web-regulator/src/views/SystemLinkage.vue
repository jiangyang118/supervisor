<template>
  <el-card class="lnk-card">
    <template #header
      ><div style="display: flex; align-items: center; justify-content: space-between">
        <span>平台关联申请</span>
      </div></template
    >
    <el-form :inline="true" class="lnk-filters"
      ><el-form-item label="状态"
        ><el-select v-model="status" clearable placeholder="全部" style="width: 160px"
          ><el-option label="待审核" value="PENDING" /><el-option
            label="已通过"
            value="APPROVED" /><el-option
            label="已拒绝"
            value="REJECTED" /></el-select></el-form-item
      ><el-form-item><el-button @click="load">查询</el-button></el-form-item></el-form
    >
    <el-table :data="rows" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="org" label="下级平台/单位" />
      <el-table-column prop="contact" label="联系人" width="160" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="申请时间" width="200" />
      <el-table-column label="操作" width="220"
        ><template #default="{ row }"
          ><el-button
            size="small"
            type="success"
            :disabled="row.status !== 'PENDING'"
            @click="review(row, 'APPROVED')"
            >通过</el-button
          ><el-button
            size="small"
            type="danger"
            :disabled="row.status !== 'PENDING'"
            @click="review(row, 'REJECTED')"
            >拒绝</el-button
          ></template
        ></el-table-column
      >
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const status = ref<string | ''>('');
async function load() {
  rows.value = await api.sysLinkageList(status.value || undefined);
}
async function review(row: any, s: 'APPROVED' | 'REJECTED') {
  await api.sysLinkageReview(row.id, s);
  await load();
}
onMounted(load);
</script>

<style>
.lnk-card {
  min-height: 420px;
}
.lnk-filters {
  margin-bottom: 8px;
  display: flex;
  gap: 8px 16px;
  align-items: center;
}
</style>
