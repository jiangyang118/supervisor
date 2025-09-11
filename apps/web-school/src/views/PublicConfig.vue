<template>
  <el-card>
    <template #header>公示内容配置</template>
    <el-form label-width="200px" :model="cfg" style="max-width: 720px">
      <el-form-item label="是否公开直播画面"><el-switch v-model="cfg.live" /></el-form-item>
      <el-form-item label="是否公开用户评价"><el-switch v-model="cfg.rating" /></el-form-item>
      <el-form-item label="是否公开机构证件"><el-switch v-model="cfg.orgCert" /></el-form-item>
      <el-form-item label="是否公开相关人员证件"
        ><el-switch v-model="cfg.staffCert"
      /></el-form-item>
      <el-form-item label="是否公开食安等级"><el-switch v-model="cfg.level" /></el-form-item>
      <el-form-item label="是否公开食材溯源信息"><el-switch v-model="cfg.trace" /></el-form-item>
      <el-form-item label="是否公开营养菜品"><el-switch v-model="cfg.menu" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存</el-button>
        <el-button style="margin-left: 8px" @click="openAudit">变更历史</el-button>
        <span style="margin-left: 12px; color: #999"
          >最近更新：{{ cfg.updatedAt ? formatTime(cfg.updatedAt) : '-' }}</span
        >
      </el-form-item>
    </el-form>
  </el-card>
  <el-dialog v-model="auditDlg" title="变更历史" width="680px">
    <el-table :data="auditRows"  border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="by" label="操作人" width="120" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.at) }}</template>
      </el-table-column>
      <el-table-column prop="changes" label="变更" />
    </el-table>
    <template #footer>
      <el-button @click="auditDlg = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
const cfg = reactive<any>({
  live: true,
  rating: true,
  orgCert: true,
  staffCert: true,
  level: true,
  trace: true,
  menu: true,
  updatedAt: '',
});
const auditDlg = ref(false);
const auditRows = ref<any[]>([]);
async function load() {
  const c = await api.publicConfigGet(getCurrentSchoolId());
  Object.assign(cfg, c);
}
async function save() {
  await api.publicConfigUpdate({ ...cfg, schoolId: getCurrentSchoolId(), updatedBy: '管理员' });
  await load();
}
async function openAudit() {
  auditRows.value = await api.publicConfigAudit(getCurrentSchoolId());
  auditDlg.value = true;
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
onMounted(() => {
  load();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
});
</script>
