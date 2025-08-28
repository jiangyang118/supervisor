<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
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
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" :title="editId ? '编辑仓库' : '新增仓库'" width="520px">
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
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';
type Row = { id: string; name: string; location?: string; capacity?: number };
const rows = ref<Row[]>([]);
const createVisible = ref(false);
const editId = ref<string | null>(null);
const form = reactive({ name: '', location: '', capacity: 0 });
async function load() {
  rows.value = await api.invWarehouses(getCurrentSchoolId());
}
const openCreate = () => {
  editId.value = null;
  Object.assign(form, { name: '', location: '', capacity: 0 });
  createVisible.value = true;
};
const openEdit = (row: Row) => {
  editId.value = row.id;
  Object.assign(form, {
    name: row.name,
    location: row.location || '',
    capacity: row.capacity || 0,
  });
  createVisible.value = true;
};
const save = async () => {
  if (!form.name) return ElMessage.warning('请填写名称');
  if (editId.value) await api.invWarehouseUpdate(editId.value, form);
  else await api.invWarehouseCreate({ ...form, schoolId: getCurrentSchoolId() });
  ElMessage.success('已保存');
  createVisible.value = false;
  await load();
};
const del = async (row: Row) => {
  await ElMessageBox.confirm(`确认删除仓库“${row.name}”？`, '提示');
  await api.invWarehouseDelete(row.id);
  ElMessage.success('已删除');
  await load();
};
const onExportCsv = () =>
  exportCsv('仓库信息', rows.value, { id: 'ID', name: '名称', location: '位置', capacity: '容量' });
let off: any = null;
onMounted(() => {
  load();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  try {
    off?.();
  } catch {}
});
</script>
