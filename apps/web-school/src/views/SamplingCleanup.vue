<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>样品清理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增清理记录</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="method" label="处理方式" />
      <el-table-column prop="by" label="处理人" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增清理记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="样品">
        <el-input v-model="form.sample" />
      </el-form-item>
      <el-form-item label="处理方式">
        <el-select v-model="form.method">
          <el-option label="销毁" value="销毁" />
          <el-option label="回收" value="回收" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理人">
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
type Row = { id: string; sample: string; method: string; by: string; at: string };
const rows = ref<Row[]>([
  {
    id: 'CL-001',
    sample: '午餐菜品A',
    method: '销毁',
    by: '李四',
    at: new Date().toLocaleString(),
  },
]);
const createVisible = ref(false);
const form = reactive({ sample: '', method: '销毁', by: '' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `CL-${String(rows.value.length + 1).padStart(3, '0')}`,
    sample: form.sample,
    method: form.method,
    by: form.by,
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('样品清理', rows.value, {
    id: 'ID',
    sample: '样品',
    method: '处理方式',
    by: '处理人',
    at: '时间',
  });
</script>
