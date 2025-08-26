<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>卫生检查台账</span>
        <div>
          <el-button type="primary" @click="openCreate">新建检查</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="item" label="检查项" />
      <el-table-column prop="result" label="结果" width="120" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建卫生检查" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="检查项">
        <el-input v-model="form.item" />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="form.result">
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" />
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
type Row = { id: string; item: string; result: string; remark: string; at: string };
const rows = ref<Row[]>([
  { id: 'HY-001', item: '操作台卫生', result: '合格', remark: '', at: new Date().toLocaleString() },
]);
const createVisible = ref(false);
const form = reactive({ item: '', result: '合格', remark: '' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `HY-${String(rows.value.length + 1).padStart(3, '0')}`,
    item: form.item,
    result: form.result,
    remark: form.remark,
    at: new Date().toLocaleString(),
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('卫生检查', rows.value, {
    id: 'ID',
    item: '检查项',
    result: '结果',
    remark: '备注',
    at: '时间',
  });
</script>
