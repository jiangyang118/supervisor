<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>陪餐台账</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom:8px;">
      <el-form-item label="学校">
        <el-input v-model="filters.school" />
      </el-form-item>
      <el-form-item label="餐次">
        <el-select v-model="filters.meal" clearable>
          <el-option label="早餐" value="早餐" />
          <el-option label="午餐" value="午餐" />
          <el-option label="晚餐" value="晚餐" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="meal" label="餐次" width="120" />
      <el-table-column prop="people" label="人员" />
      <el-table-column prop="comment" label="评价" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; school: string; meal: string; people: string; comment: string; at: string };
const rows = ref<Row[]>([
  { id: 'DW-001', school: '示例二小', meal: '午餐', people: '校长,家长代表', comment: '满意', at: new Date().toLocaleString() },
]);
const filters = reactive<{ school: string; meal: string|undefined }>({ school:'', meal: undefined });
const onExportCsv = () => exportCsv('陪餐台账-监管', rows.value, { id:'ID', school:'学校', meal:'餐次', people:'人员', comment:'评价', at:'时间' });
</script>

