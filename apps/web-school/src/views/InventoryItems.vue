<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>商品管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增商品</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column label="分类"><template #default="{ row }">{{ categoryName(row.categoryId) }}</template></el-table-column>
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
        <el-select v-model="form.categoryId" style="width: 240px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
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
const rows = ref<any[]>([]);
const categories = ref<any[]>([]);
const createVisible = ref(false);
const form = reactive<{ name: string; unit: string; categoryId?: string }>({ name: '', unit: 'kg' });
function categoryName(id?: string){ return categories.value.find((c:any)=>c.id===id)?.name || '-'; }
async function load(){ rows.value = await api.invProducts(); categories.value = await api.invCategories(); }
const openCreate = () => { form.name=''; form.unit='kg'; form.categoryId = categories.value[0]?.id; createVisible.value = true; };
async function save(){ await api.invProductCreate(form as any); createVisible.value=false; load(); }
const onExportCsv = () => exportCsv('商品管理', rows.value, { id: 'ID', name: '名称', unit: '单位', categoryId: '分类ID' });
onMounted(()=>load());
</script>
