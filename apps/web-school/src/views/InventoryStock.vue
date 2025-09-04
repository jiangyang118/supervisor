<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>库存与盘点</span>
        <div>
          <el-button type="primary" @click="doCheck">库存盘点</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="item" label="商品" />
      <el-table-column prop="qty" label="库存" width="120" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
const rows = ref<any[]>([]);
const products = ref<any[]>([]);
function productName(id: string) {
  return products.value.find((p: any) => p.id === id)?.name || id;
}
function fmtSeconds(d: Date) {
  try {
    // 本地时间，精确到秒
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getFullYear() +
      '-' + pad(d.getMonth() + 1) +
      '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) +
      ':' + pad(d.getMinutes()) +
      ':' + pad(d.getSeconds())
    );
  } catch {
    return d.toISOString().replace(/\..+/, '');
  }
}
async function load() {
  // 先取产品，便于映射名称与单位
  products.value = await api.invProducts(getCurrentSchoolId());
  const stock = await api.invStock(getCurrentSchoolId());
  rows.value = (stock || []).map((r: any) => {
    const p = products.value.find((x: any) => x.id === r.productId);
    return {
      productId: r.productId,
      item: p?.name || r.productId,
      unit: p?.unit || '',
      qty: Number(r.qty || 0),
      updatedAt: r.updatedAt,
    };
  });
}
async function doCheck() {
  if (rows.value.length > 0)
    await api.invStocktake({
      productId: rows.value[0].productId,
      qty: rows.value[0].qty,
      schoolId: getCurrentSchoolId(),
    });
  await load();
}
const onExportCsv = () =>
  exportCsv('库存盘点', rows.value, { item: '商品', qty: '库存', unit: '单位', updatedAt: '更新时间' });
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
