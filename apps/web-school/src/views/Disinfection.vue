<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>消毒管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新建</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
          <el-button @click="onExportPdf">导出 PDF</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom:8px;">
      <el-form-item label="方式">
        <el-select v-model="filters.method" clearable>
          <el-option label="酒精" value="酒精" />
          <el-option label="紫外" value="紫外" />
          <el-option label="高温" value="高温" />
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
      <el-table-column prop="id" label="ID" width="160" />
      <el-table-column prop="method" label="方式" width="120" />
      <el-table-column prop="duration" label="时长(分钟)" width="120" />
      <el-table-column prop="items" label="物品/区域" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="dispose(row)">处置</el-button>
          <el-button size="small" type="danger" text @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建设备消毒记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="方式">
        <el-select v-model="form.method">
          <el-option label="酒精" value="酒精" />
          <el-option label="紫外" value="紫外" />
          <el-option label="高温" value="高温" />
        </el-select>
      </el-form-item>
      <el-form-item label="时长(分钟)">
        <el-input-number v-model="form.duration" :min="1" />
      </el-form-item>
      <el-form-item label="物品/区域">
        <el-input v-model="form.items" />
      </el-form-item>
      <el-form-item label="图片">
        <el-upload action="#" list-type="picture" :auto-upload="false">
          <el-button>选择图片（占位）</el-button>
        </el-upload>
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

type Row = { id: string; method: string; duration: number; items: string; status: string; at: string; };
const rows = ref<Row[]>([
  { id: 'DS-001', method: '酒精', duration: 30, items: '案板/台面', status: '正常', at: new Date().toLocaleString() },
  { id: 'DS-002', method: '紫外', duration: 15, items: '餐具', status: '正常', at: new Date().toLocaleString() },
]);

const filters = reactive<{ method: string|undefined; range: [Date,Date]|null }>({ method: undefined, range: null });
const applyFilters = () => {};

const createVisible = ref(false);
const form = reactive({ method: '酒精', duration: 30, items: '' });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `DS-${String(rows.value.length+1).padStart(3,'0')}`, method: form.method, duration: form.duration, items: form.items, status: '正常', at: new Date().toLocaleString() });
  createVisible.value = false;
};
const remove = (id: string) => { rows.value = rows.value.filter(r => r.id !== id); };
const dispose = (row: Row) => { alert(`处置记录 ${row.id}（演示）`); };

const onExportCsv = () => exportCsv('消毒管理', rows.value, { id:'ID', method:'方式', duration:'时长', items:'物品', status:'状态', at:'时间' });
const onExportPdf = () => alert('导出 PDF（演示）');
</script>

