<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>废弃物管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增记录</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="种类">
        <el-select v-model="filters.category" clearable>
          <el-option label="餐厨垃圾" value="餐厨垃圾" />
          <el-option label="过期食材" value="过期食材" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="category" label="种类" />
      <el-table-column prop="amount" label="数量(kg)" width="140" />
      <el-table-column prop="buyer" label="收购单位" />
      <el-table-column prop="person" label="收运人" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增废弃物记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="日期">
        <el-date-picker v-model="form.date" type="date" />
      </el-form-item>
      <el-form-item label="种类">
        <el-select v-model="form.category">
          <el-option label="餐厨垃圾" value="餐厨垃圾" />
          <el-option label="过期食材" value="过期食材" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量(kg)">
        <el-input-number v-model="form.amount" :min="0" />
      </el-form-item>
      <el-form-item label="收购单位">
        <el-input v-model="form.buyer" />
      </el-form-item>
      <el-form-item label="收运人">
        <el-input v-model="form.person" />
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
  date: string;
  category: string;
  amount: number;
  buyer: string;
  person: string;
};
const rows = ref<Row[]>([
  {
    id: 'WS-001',
    date: new Date().toLocaleDateString(),
    category: '餐厨垃圾',
    amount: 20,
    buyer: '示例回收公司',
    person: '王五',
  },
]);
const filters = reactive<{ category: string | undefined; range: [Date, Date] | null }>({
  category: '餐厨垃圾',
  range: null,
});
const applyFilters = () => {};
const createVisible = ref(false);
const form = reactive({ date: new Date(), category: '餐厨垃圾', amount: 0, buyer: '', person: '' });
const openCreate = () => {
  createVisible.value = true;
};
const save = () => {
  rows.value.unshift({
    id: `WS-${String(rows.value.length + 1).padStart(3, '0')}`,
    date: (form.date as any)?.toLocaleDateString?.() ?? String(form.date),
    category: form.category,
    amount: form.amount,
    buyer: form.buyer,
    person: form.person,
  });
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('废弃物管理', rows.value, {
    id: 'ID',
    date: '日期',
    category: '种类',
    amount: '数量(kg)',
    buyer: '收购单位',
    person: '收运人',
  });
</script>
