<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>出库登记</span>
        <div>
          <el-button type="primary" @click="openCreate">新增出库</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column label="商品"
        ><template #default="{ row }">{{ productName(row.productId) }}</template></el-table-column
      >
      <el-table-column prop="qty" label="数量" width="120" />
      <el-table-column prop="purpose" label="用途" />
      <el-table-column prop="by" label="出库人" />
      <el-table-column label="时间" width="180"
        ><template #default="{ row }">{{ formatTime(row.at) }}</template></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增出库" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="商品">
        <el-select v-model="form.productId" placeholder="请选择" style="width: 240px">
          <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number v-model="form.qty" :min="1" />
      </el-form-item>
      <el-form-item label="用途">
        <el-input v-model="form.purpose" />
      </el-form-item>
      <el-form-item label="出库人">
        <el-input v-model="form.by" />
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
import { ElMessage } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';
const rows = ref<any[]>([]);
const products = ref<any[]>([]);
function productName(id: string) {
  return products.value.find((p: any) => p.id === id)?.name || '-';
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
async function load() {
  rows.value = await api.invOutboundList(getCurrentSchoolId());
  products.value = await api.invProducts(getCurrentSchoolId());
}
const createVisible = ref(false);
const form = reactive<{ productId: string; qty: number; purpose?: string; by?: string }>({
  productId: '',
  qty: 1,
});
const openCreate = () => {
  form.productId = products.value[0]?.id || '';
  form.qty = 1;
  form.purpose = '';
  form.by = '';
  createVisible.value = true;
};
async function save() {
  if (!form.productId || !form.qty) {
    ElMessage.warning('请选择商品并填写数量');
    return;
  }
  await api.invOutboundCreate({ ...form, schoolId: getCurrentSchoolId() } as any);
  ElMessage.success('已上报');
  createVisible.value = false;
  load();
}
const onExportCsv = () =>
  exportCsv('出库登记', rows.value, {
    id: 'ID',
    productId: '商品ID',
    qty: '数量',
    purpose: '用途',
    by: '出库人',
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
  try {
    off?.();
  } catch {}
});
</script>
