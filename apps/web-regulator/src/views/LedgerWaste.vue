<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>废弃物台账</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom:8px;">
      <el-form-item label="学校">
        <el-input v-model="filters.school" />
      </el-form-item>
      <el-form-item label="种类">
        <el-select v-model="filters.category" clearable>
          <el-option label="餐厨垃圾" value="餐厨垃圾" />
          <el-option label="过期食材" value="过期食材" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="category" label="种类" />
      <el-table-column prop="amount" label="数量(kg)" width="140" />
      <el-table-column prop="buyer" label="收购单位" />
      <el-table-column prop="person" label="收运人" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; school: string; date: string; category: string; amount: number; buyer: string; person: string };
const rows = ref<Row[]>([
  { id: 'WS-001', school: '示例一中', date: new Date().toLocaleDateString(), category: '餐厨垃圾', amount: 30, buyer: '回收公司A', person: '李四' },
]);
const filters = reactive<{ school: string; category: string|undefined }>({ school:'', category: undefined });
const onExportCsv = () => exportCsv('废弃物台账-监管', rows.value, { id:'ID', school:'学校', date:'日期', category:'种类', amount:'数量(kg)', buyer:'收购单位', person:'收运人' });
</script>

