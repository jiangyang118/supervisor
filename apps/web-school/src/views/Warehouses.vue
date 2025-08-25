<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>仓库信息管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增仓库</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="location" label="位置" />
      <el-table-column prop="capacity" label="容量(立方米)" width="160" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增仓库" width="520px">
    <el-form :model="form" label-width="120px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="位置">
        <el-input v-model="form.location" />
      </el-form-item>
      <el-form-item label="容量(立方米)">
        <el-input-number v-model="form.capacity" :min="0" />
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
type Row = { id: string; name: string; location: string; capacity: number };
const rows = ref<Row[]>([
  { id: 'WH-001', name: '主仓库', location: '食堂东侧', capacity: 100 },
]);
const createVisible = ref(false);
const form = reactive({ name: '', location: '', capacity: 0 });
const openCreate = () => { createVisible.value = true; };
const save = () => {
  rows.value.unshift({ id: `WH-${String(rows.value.length+1).padStart(3,'0')}`, name: form.name, location: form.location, capacity: form.capacity });
  createVisible.value = false;
};
const onExportCsv = () => exportCsv('仓库信息', rows.value, { id:'ID', name:'名称', location:'位置', capacity:'容量' });
</script>

