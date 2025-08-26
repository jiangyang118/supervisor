<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>资质证件管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增证件</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="owner" label="主体" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="number" label="证件号" />
      <el-table-column prop="expireAt" label="到期时间" width="160" />
      <el-table-column prop="status" label="状态" width="120" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增证件" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="主体">
        <el-input v-model="form.owner" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type">
          <el-option label="人员健康证" value="人员健康证" />
          <el-option label="供应商证照" value="供应商证照" />
          <el-option label="食堂许可证" value="食堂许可证" />
        </el-select>
      </el-form-item>
      <el-form-item label="证件号">
        <el-input v-model="form.number" />
      </el-form-item>
      <el-form-item label="到期时间">
        <el-date-picker v-model="form.expireAt" type="date" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = {
  id: string;
  owner: string;
  type: string;
  number: string;
  expireAt: string;
  status: string;
};
const rows = ref<Row[]>([
  {
    id: 'CF-001',
    owner: '张三',
    type: '人员健康证',
    number: 'HC-888',
    expireAt: '2026-12-31',
    status: '有效',
  },
]);
const createVisible = ref(false);
const form = reactive({ owner: '', type: '人员健康证', number: '', expireAt: new Date() });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  const exp = (form.expireAt as any)?.toISOString?.().slice(0, 10) ?? String(form.expireAt);
  rows.value.unshift({
    id: `CF-${String(rows.value.length + 1).padStart(3, '0')}`,
    owner: form.owner,
    type: form.type,
    number: form.number,
    expireAt: exp,
    status: '有效',
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('资质证件', rows.value, {
    id: 'ID',
    owner: '主体',
    type: '类型',
    number: '证件号',
    expireAt: '到期时间',
    status: '状态',
  });
</script>
