<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>商品管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增商品</el-button>
          <el-button @click="openCategoryDialog">商品分类</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column label="分类"
        ><template #default="{ row }">{{ categoryName(row.categoryId) }}</template></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增商品" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="form.unit" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.categoryId" placeholder="请选择" style="width: 240px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button link type="primary" @click="openCategoryDialog">新增类别</el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
  <el-dialog v-model="categoryDialogVisible" title="商品分类" width="520px">
    <div style="margin-bottom: 12px">
      <el-input v-model="newCategory" placeholder="输入类别名称后点击添加" style="width: 320px; margin-right: 8px" />
      <el-button type="primary" @click="addCategory">添加</el-button>
    </div>
    <el-table :data="categories" size="small" border>
      <el-table-column prop="id" label="ID" width="160" />
      <el-table-column prop="name" label="名称" />
    </el-table>
    <template #footer>
      <el-button @click="categoryDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
 </template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
const rows = ref<any[]>([]);
const categories = ref<any[]>([]);
const createVisible = ref(false);
const form = reactive<{ name: string; unit: string; categoryId?: string }>({
  name: '',
  unit: 'kg',
});
function categoryName(id?: string) {
  return categories.value.find((c: any) => c.id === id)?.name || '-';
}
async function load() {
  rows.value = await api.invProducts(getCurrentSchoolId());
  categories.value = await api.invCategories(getCurrentSchoolId());
}
const openCreate = () => {
  form.name = '';
  form.unit = 'kg';
  form.categoryId = categories.value[0]?.id;
  createVisible.value = true;
};
async function save() {
  await api.invProductCreate({ ...form, schoolId: getCurrentSchoolId() } as any);
  createVisible.value = false;
  load();
}
const onExportCsv = () =>
  exportCsv('商品管理', rows.value, { id: 'ID', name: '名称', unit: '单位', categoryId: '分类ID' });

// 类别管理（简化版：新增 + 查看列表）
const categoryDialogVisible = ref(false);
const newCategory = ref('');
function openCategoryDialog() {
  newCategory.value = '';
  categoryDialogVisible.value = true;
}
async function addCategory() {
  const name = newCategory.value.trim();
  if (!name) return;
  await api.invCategoryCreate(name, getCurrentSchoolId());
  categories.value = await api.invCategories(getCurrentSchoolId());
  // 选中新建的类别
  const created = categories.value.find((c: any) => c.name === name);
  if (created) form.categoryId = created.id;
  categoryDialogVisible.value = false;
}
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

 
