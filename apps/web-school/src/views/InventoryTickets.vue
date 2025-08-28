<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>索票索证</span>
        <div>
          <el-button type="primary" @click="openCreate">补传凭证</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="item" label="商品" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="补传索证凭证" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="商品">
        <el-input v-model="form.item" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" placeholder="请选择">
          <el-option label="检验报告" value="检验报告" />
          <el-option label="合格证" value="合格证" />
          <el-option label="发票" value="发票" />
        </el-select>
      </el-form-item>
      <el-form-item label="图片">
        <el-upload action="#" list-type="picture" :auto-upload="false">
          <el-button>选择图片（占位）</el-button>
        </el-upload>
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
type Row = { id: string; item: string; type: string; status: string; at: string };
const rows = ref<Row[]>([
  { id: 'TK-001', item: '大米', type: '合格证', status: '已上传', at: new Date().toLocaleString() },
]);
const createVisible = ref(false);
const form = reactive({ item: '', type: '检验报告' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `TK-${String(rows.value.length + 1).padStart(3, '0')}`,
    item: form.item,
    type: form.type,
    status: '已上传',
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('索票索证', rows.value, {
    id: 'ID',
    item: '商品',
    type: '类型',
    status: '状态',
    at: '时间',
  });
</script>
