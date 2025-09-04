<template>
  <el-card>
    <template #header>食堂信息维护+食堂资质</template>
    <el-form label-width="120px" :model="form" style="max-width: 720px">
      <el-form-item label="食堂名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="负责人"><el-input v-model="form.manager" /></el-form-item>
      <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
      <el-form-item><el-button type="primary" @click="save">保存</el-button></el-form-item>
    </el-form>
    <el-divider />
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="font-weight:600">食堂资质（证照）</div>
      <el-button size="small" type="primary" @click="openCert">新增资质</el-button>
    </div>
    <el-table :data="certs" size="small" border>
      <el-table-column prop="owner" label="归属" width="140" />
      <el-table-column prop="type" label="类型" width="140" />
      <el-table-column prop="number" label="证件号" width="200" />
      <el-table-column prop="expireAt" label="到期" width="140" />
      <el-table-column prop="imageUrl" label="图片" />
    </el-table>
    <el-dialog v-model="certDlg" title="新增资质" width="520px">
      <el-form :model="certForm" label-width="96px">
        <el-form-item label="主体"><el-input v-model="certForm.owner" disabled /></el-form-item>
        <el-form-item label="类型" required><el-input v-model="certForm.type" /></el-form-item>
        <el-form-item label="证件号" required><el-input v-model="certForm.number" /></el-form-item>
        <el-form-item label="到期日期" required>
          <el-date-picker v-model="certForm.expireAt" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="certDlg=false">取消</el-button>
        <el-button type="primary" @click="saveCert">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { api } from '../services/api';
const form = reactive<any>({ name: '', manager: '', phone: '', address: '' });
const certs = ref<any[]>([]);
async function load() {
  const c = await api.sysCanteenGet();
  Object.assign(form, c || {});
  try { certs.value = await api.certList({ owner: 'canteen' }); } catch { certs.value = []; }
}
async function save() {
  await api.sysCanteenSave(form as any);
  await load();
}
onMounted(load);

// Certificates create
const certDlg = ref(false);
const certForm = reactive<{ owner: string; type: string; number: string; expireAt: string | '' }>({ owner: 'canteen', type: '', number: '', expireAt: '' });
function openCert() {
  certForm.owner = 'canteen';
  certForm.type = '';
  certForm.number = '';
  certForm.expireAt = '' as any;
  certDlg.value = true;
}
async function saveCert() {
  if (!certForm.type || !certForm.number || !certForm.expireAt) return;
  await api.certCreate({ owner: certForm.owner, type: certForm.type, number: certForm.number, expireAt: certForm.expireAt });
  certDlg.value = false;
  await load();
}
</script>

<style scoped></style>
