<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>资质证件管理</span>
        <div>
          <el-input
            v-model="filters.owner"
            placeholder="主体"
            size="small"
            style="width: 180px; margin-right: 8px"
          />
          <el-select
            v-model="filters.type"
            placeholder="请选择"
            size="small"
            style="width: 160px; margin-right: 8px"
          >
            <el-option label="全部" value="" />
            <el-option label="人员健康证" value="人员健康证" />
            <el-option label="供应商证照" value="供应商证照" />
            <el-option label="食堂许可证" value="食堂许可证" />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="请选择"
            size="small"
            style="width: 120px; margin-right: 8px"
          >
            <el-option label="全部" value="" />
            <el-option label="有效" value="有效" />
            <el-option label="过期" value="过期" />
          </el-select>
          <el-button size="small" @click="load">查询</el-button>
          <el-divider direction="vertical" />
          <el-button type="primary" @click="openCreate">新增证件</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="owner" label="主体" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="number" label="证件号" />
      <el-table-column prop="expireAt" label="到期时间" width="160" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === '有效' ? 'success' : 'danger'" effect="plain">{{
            row.status
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" :title="editId ? '编辑证件' : '新增证件'" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="主体">
        <el-input v-model="form.owner" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" placeholder="请选择">
          <el-option label="人员健康证" value="人员健康证" />
          <el-option label="供应商证照" value="供应商证照" />
          <el-option label="食堂许可证" value="食堂许可证" />
        </el-select>
      </el-form-item>
      <el-form-item label="证件号">
        <el-input v-model="form.number" />
      </el-form-item>
      <el-form-item label="到期时间">
        <el-date-picker v-model="form.expireAt" type="date" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
type Row = {
  id: string;
  owner: string;
  type: string;
  number: string;
  expireAt: string;
  status: string;
};
const rows = ref<Row[]>([]);
const filters = reactive<{ owner: string; type: string; status: '' | '有效' | '过期' }>({
  owner: '',
  type: '',
  status: '',
});
const createVisible = ref(false);
const editId = ref<string | null>(null);
const form = reactive<any>({ owner: '', type: '人员健康证', number: '', expireAt: new Date() });
async function load() {
  rows.value = await api.certList({
    owner: filters.owner || undefined,
    type: filters.type || undefined,
    status: (filters.status as any) || undefined,
  });
}
const openCreate = () => {
  editId.value = null;
  Object.assign(form, { owner: '', type: '人员健康证', number: '', expireAt: new Date() });
  createVisible.value = true;
};
const openEdit = (row: Row) => {
  editId.value = row.id;
  const d = new Date(row.expireAt);
  Object.assign(form, {
    owner: row.owner,
    type: row.type,
    number: row.number,
    expireAt: isNaN(d.getTime()) ? new Date() : d,
  });
  createVisible.value = true;
};
const save = async () => {
  try {
    const exp = (form.expireAt as any)?.toISOString?.().slice(0, 10) ?? String(form.expireAt);
    if (editId.value)
      await api.certUpdate(editId.value, {
        owner: form.owner,
        type: form.type,
        number: form.number,
        expireAt: exp,
      });
    else
      await api.certCreate({
        owner: form.owner,
        type: form.type,
        number: form.number,
        expireAt: exp,
      });
    ElMessage.success('已保存');
    createVisible.value = false;
    await load();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  }
};
const del = async (row: Row) => {
  await ElMessageBox.confirm(`确认删除证件“${row.number}”？`, '提示');
  await api.certDelete(row.id);
  ElMessage.success('已删除');
  await load();
};
async function onExportCsv() {
  const csv = await api.certExportCsv({
    owner: filters.owner || undefined,
    type: filters.type || undefined,
    status: (filters.status as any) || undefined,
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '资质证件.csv';
  a.click();
  URL.revokeObjectURL(url);
}
onMounted(load);
</script>
