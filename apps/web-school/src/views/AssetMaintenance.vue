<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>固定资产维护台账</span>
        <div>
          <el-button type="primary" @click="openCreate">新建维护</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="asset" label="资产" />
      <el-table-column prop="action" label="维护动作" />
      <el-table-column prop="by" label="负责人" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建资产维护" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="资产">
        <el-input v-model="form.asset" />
      </el-form-item>
      <el-form-item label="维护动作">
        <el-input v-model="form.action" />
      </el-form-item>
      <el-form-item label="负责人">
        <el-input v-model="form.by" />
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
type Row = { id: string; asset: string; action: string; by: string; at: string };
const rows = ref<Row[]>([
  {
    id: 'AM-001',
    asset: '留样柜 A-1',
    action: '定期保养',
    by: '设备管理员',
    at: new Date().toLocaleString(),
  },
]);
const createVisible = ref(false);
const form = reactive({ asset: '', action: '', by: '' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `AM-${String(rows.value.length + 1).padStart(3, '0')}`,
    asset: form.asset,
    action: form.action,
    by: form.by,
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('固定资产维护', rows.value, {
    id: 'ID',
    asset: '资产',
    action: '维护动作',
    by: '负责人',
    at: '时间',
  });
</script>
