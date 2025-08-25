<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>农残快检管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新建</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
          <el-button @click="onExportPdf">导出 PDF</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom:8px;">
      <el-form-item label="关键词">
        <el-input v-model="filters.q" placeholder="样品/人员/设备" clearable />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="filters.result" placeholder="全部" clearable>
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
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
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="device" label="检测仪" />
      <el-table-column prop="result" label="结果" width="120" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="上报时间" width="180" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="dispose(row)">处置</el-button>
          <el-button size="small" type="danger" text @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建农残检测记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="样品">
        <el-input v-model="form.sample" />
      </el-form-item>
      <el-form-item label="检测仪">
        <el-input v-model="form.device" />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="form.result">
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" />
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

type Row = { id: string; sample: string; device: string; result: '合格'|'不合格'; status: string; at: string; };
const rows = ref<Row[]>([
  { id: 'PT-001', sample: '黄瓜', device: 'PRT-100', result: '合格', status: '正常', at: new Date().toLocaleString() },
  { id: 'PT-002', sample: '菠菜', device: 'PRT-100', result: '不合格', status: '异常', at: new Date().toLocaleString() },
]);

const filters = reactive<{ q: string; result: ''|'合格'|'不合格'|null; range: [Date,Date]|null }>({ q:'', result:null, range: null });
const applyFilters = () => {
  // Demo: no-op. Hook API later.
};

const createVisible = ref(false);
const form = reactive({ sample: '', device: '', result: '合格', remark: '' });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `PT-${String(rows.value.length+1).padStart(3,'0')}`, sample: form.sample, device: form.device, result: form.result as any, status: form.result === '合格' ? '正常':'异常', at: new Date().toLocaleString() });
  createVisible.value = false;
};
const remove = (id: string) => { rows.value = rows.value.filter(r => r.id !== id); };
const dispose = (row: Row) => { alert(`处置记录 ${row.id}（演示）`); };

const onExportCsv = () => exportCsv('农残快检', rows.value, { id:'ID', sample:'样品', device:'检测仪', result:'结果', status:'状态', at:'时间' });
const onExportPdf = () => alert('导出 PDF（演示）');
</script>

