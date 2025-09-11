<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>库存记录（批次）</span>
        <div style="display:flex;gap:8px;align-items:center">
          <el-switch v-model="showNear" active-text="仅临期" />
          <el-button type="primary" @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows"  border>
      <el-table-column prop="productName" label="商品名称" min-width="180" />
      <el-table-column prop="batchNo" label="批次号" width="160" />
      <el-table-column prop="qty" label="当前库存数量" width="140" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="prodDate" label="生产日期" width="140" />
      <el-table-column prop="expireAt" label="保质期至" width="140" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status==='过期'?'danger':row.status==='临期'?'warning':'success'" effect="plain">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button  @click="openStocktake(row)">盘点</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" title="库存盘点" width="420px">
    <el-form label-width="120px">
      <el-form-item label="商品">
        <span>{{ current?.productName }}</span>
      </el-form-item>
      <el-form-item label="批次号">
        <span>{{ current?.batchNo }}</span>
      </el-form-item>
      <el-form-item label="当前库存">
        <span>{{ current?.qty }} {{ current?.unit }}</span>
      </el-form-item>
      <el-form-item label="实际库存">
        <el-input-number v-model="actualQty" :min="0" />
      </el-form-item>
      <el-form-item label="盘点人(可选)">
        <el-input v-model="operator" placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible=false">取消</el-button>
      <el-button type="primary" @click="doStocktake">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
const rows = ref<any[]>([]);
const showNear = ref<boolean>(false);
async function load() {
  rows.value = await api.invStockBatches({ schoolId: getCurrentSchoolId() as any, near: showNear.value ? 'true' : undefined } as any);
}
const onExportCsv = () =>
  exportCsv('库存（批次）', rows.value, { productName: '商品名称', batchNo: '批次号', qty: '当前库存数量', unit: '单位', prodDate: '生产日期', expireAt: '保质期至', status: '状态' });
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

watch(showNear, () => load());

const dialogVisible = ref(false);
const current = ref<any>(null);
const actualQty = ref<number>(0);
const operator = ref<string>('');
function openStocktake(row: any) {
  current.value = row;
  actualQty.value = Number(row.qty || 0);
  operator.value = '';
  dialogVisible.value = true;
}
async function doStocktake() {
  if (!current.value) return;
  await api.invStocktakeBatch({ schoolId: getCurrentSchoolId() as any, inboundId: current.value.inboundId, actualQty: actualQty.value, operator: operator.value || undefined });
  dialogVisible.value = false;
  await load();
}
</script>
