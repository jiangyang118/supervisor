<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>陪餐管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增陪餐</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom:8px;">
      <el-form-item label="餐次">
        <el-select v-model="filters.meal" clearable>
          <el-option label="早餐" value="早餐" />
          <el-option label="午餐" value="午餐" />
          <el-option label="晚餐" value="晚餐" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="meal" label="餐次" width="120" />
      <el-table-column prop="people" label="人员" />
      <el-table-column prop="comment" label="评价" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增陪餐" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="餐次">
        <el-select v-model="form.meal">
          <el-option label="早餐" value="早餐" />
          <el-option label="午餐" value="午餐" />
          <el-option label="晚餐" value="晚餐" />
        </el-select>
      </el-form-item>
      <el-form-item label="人员">
        <el-input v-model="form.people" placeholder="多人用逗号分隔" />
      </el-form-item>
      <el-form-item label="评价">
        <el-input v-model="form.comment" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible=false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = { id: string; meal: string; people: string; comment: string; at: string };
const rows = ref<Row[]>([
  { id: 'DW-001', meal: '午餐', people: '校长,食堂主管', comment: '满意', at: new Date().toLocaleString() },
]);
const filters = reactive<{ meal: string|undefined }>({ meal: undefined });
const applyFilters = () => {};
const createVisible = ref(false);
const form = reactive({ meal: '午餐', people: '', comment: '' });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `DW-${String(rows.value.length+1).padStart(3,'0')}`, meal: form.meal, people: form.people, comment: form.comment, at: new Date().toLocaleString() });
  createVisible.value = false;
};
const onExportCsv = () => exportCsv('陪餐管理', rows.value, { id:'ID', meal:'餐次', people:'人员', comment:'评价', at:'时间' });
</script>

