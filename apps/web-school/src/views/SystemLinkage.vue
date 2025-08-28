<template>
  <el-card>
    <template #header>与监管端关联申请</template>
    <el-form :model="form" label-width="120px" style="max-width: 640px">
      <el-form-item label="监管单位"><el-input v-model="form.org" /></el-form-item>
      <el-form-item label="联系人"><el-input v-model="form.contact" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      <el-form-item><el-button type="primary" @click="submit">提交申请</el-button></el-form-item>
    </el-form>
    <el-divider />
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="org" label="监管单位" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="220"
        ><template #default="{ row }">
          <el-button
            v-if="row.status === 'PENDING'"
            size="small"
            type="success"
            @click="review(row, 'APPROVED')"
            >同意</el-button
          >
          <el-button
            v-if="row.status === 'PENDING'"
            size="small"
            type="danger"
            @click="review(row, 'REJECTED')"
            >拒绝</el-button
          >
        </template></el-table-column
      >
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { api } from '../services/api';
const form = reactive({ org: '示例市市场监管局', contact: '李监管', remark: '' });
const rows = ref<any[]>([]);
async function load() {
  rows.value = await api.sysLinkageList();
}
async function submit() {
  await api.sysLinkageApply(form as any);
  await load();
}
async function review(row: any, status: 'APPROVED' | 'REJECTED') {
  await api.sysLinkageReview(row.id, status);
  await load();
}
onMounted(load);
</script>
