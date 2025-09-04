<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>索票索证</span>
        <div>
          <el-button type="primary" @click="openCreate">补传凭证</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column label="商品"><template #default="{ row }">{{ productName(row.productId) }}</template></el-table-column>
      <el-table-column prop="type" label="类型" width="140" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="补传索证凭证" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="商品">
        <el-select v-model="form.productId" placeholder="请选择" style="width:260px">
          <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" placeholder="请选择">
          <el-option label="检验报告" value="检验报告" />
          <el-option label="合格证" value="合格证" />
          <el-option label="发票" value="发票" />
        </el-select>
      </el-form-item>
      <el-form-item label="图片">
        <el-upload action="#" list-type="picture" :auto-upload="false">
          <el-button>选择图片（占位）</el-button>
        </el-upload>
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
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const products = ref<any[]>([]);
const createVisible = ref(false);
const form = reactive({ productId: undefined as any, type: '检验报告', imageUrl: '' });

function productName(id?: number | string) {
  return products.value.find((p: any) => String(p.id) === String(id))?.name || '-';
}
async function load() {
  products.value = await api.invProducts(getCurrentSchoolId());
  rows.value = await api.invTickets(getCurrentSchoolId());
}
const openCreate = () => {
  form.productId = products.value[0]?.id;
  form.type = '检验报告';
  form.imageUrl = '';
  createVisible.value = true;
};
const save = async () => {
  if (!form.productId) return ElMessage.warning('请选择商品');
  await api.invTicketCreate({ schoolId: getCurrentSchoolId(), productId: form.productId, type: form.type, imageUrl: form.imageUrl });
  ElMessage.success('已补传');
  createVisible.value = false;
  await load();
};
const onExportCsv = () =>
  exportCsv('索票索证', rows.value, {
    id: 'ID',
    productId: '商品ID',
    type: '类型',
    at: '时间',
  });

let off: any = null;
onMounted(() => {
  load();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  try { off?.(); } catch {}
});
</script>
