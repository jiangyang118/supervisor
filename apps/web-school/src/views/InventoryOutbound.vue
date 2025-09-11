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
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column label="食堂" width="160"><template #default="{ row }">{{ canteenName(row.canteenId) }}</template></el-table-column>
      <el-table-column label="商品"><template #default="{ row }">{{ productName(row.productId) }}</template></el-table-column>
      <el-table-column prop="qty" label="数量" width="120" />
      <el-table-column prop="purpose" label="用途" width="160" />
      <el-table-column prop="by" label="出库人" width="140" />
      <el-table-column prop="receiver" label="领用人" width="140" />
      <el-table-column label="出库日期" width="160"><template #default="{ row }">{{ String(row.at||'').slice(0,10) }}</template></el-table-column>
    </el-table>
  </el-card>

  <el-drawer v-model="createVisible" title="新增出库" size="80%">
    <el-form :model="form" label-width="120px">
      <el-form-item label="出库日期">
        <el-date-picker v-model="form.date" type="date" />
      </el-form-item>
      <el-form-item label="食堂">
        <el-select v-model="form.canteenId" placeholder="请选择" style="width: 260px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="Number(c.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="用途">
        <el-input v-model="form.purpose" placeholder="可选" />
      </el-form-item>
      <el-form-item label="出库人">
        <el-input v-model="form.by" placeholder="可选" style="width: 260px" />
      </el-form-item>
      <el-form-item label="领用人">
        <el-input v-model="form.receiver" placeholder="可选" style="width: 260px" />
      </el-form-item>

      <el-divider content-position="left">商品明细</el-divider>
      <div style="margin-bottom:8px"><el-button type="primary" text @click="addItem">+ 添加商品</el-button></div>
      <el-table :data="form.items" border size="small">
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <el-select v-model="row.productId" filterable placeholder="选择商品(仅显示有库存)" style="width:100%" @change="() => loadBatches(row)">
              <el-option v-for="p in inStockProducts" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="批次(先进先出)" min-width="260">
          <template #default="{ row }">
            <el-select v-model="row.batch" placeholder="选择批次" style="width:100%">
              <el-option v-for="b in row.batches || []" :key="b.inboundId" :label="`${b.date}（剩余:${b.remain}）`" :value="b.inboundId" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.qty" :min="1" :max="batchRemain(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ $index }"><el-button type="danger" text @click="removeItem($index)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 0">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="save">提交</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';
const rows = ref<any[]>([]);
const products = ref<any[]>([]);
const stock = ref<any[]>([]);
const canteens = ref<any[]>([]);
function productName(id: string) {
  return products.value.find((p: any) => p.id === id)?.name || '-';
}
function canteenName(id?: number) {
  return canteens.value.find((c:any)=> Number(c.id)===Number(id))?.name || '-';
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
  stock.value = await api.invStock(getCurrentSchoolId());
  try { canteens.value = await api.canteensList(String(getCurrentSchoolId())); } catch { canteens.value = []; }
}
const createVisible = ref(false);
const inStockProducts = computed(()=> {
  const available = new Set((stock.value || []).filter((s:any)=> Number(s.qty||0) > 0).map((s:any)=> String(s.productId)));
  return (products.value || []).filter((p:any)=> available.has(String(p.id)));
});
const form = reactive<any>({
  date: new Date(),
  canteenId: undefined as number|undefined,
  purpose: '',
  by: '',
  receiver: '',
  items: [] as Array<{ productId: string; batch?: number; qty: number; batches?: any[] }>,
});
const openCreate = () => {
  form.date = new Date();
  form.canteenId = canteens.value[0]?.id ? Number(canteens.value[0].id) : undefined;
  form.purpose = '';
  form.by = '';
  form.receiver = '';
  form.items = [];
  addItem();
  createVisible.value = true;
};
function addItem() {
  form.items.push({ productId: inStockProducts.value[0]?.id || '', qty: 1, batch: undefined, batches: [] });
  const row = form.items[form.items.length - 1];
  if (row.productId) loadBatches(row);
}
function removeItem(i: number) { form.items.splice(i,1); }
async function loadBatches(row: any) {
  if (!row?.productId) { row.batches = []; row.batch = undefined; return; }
  try {
    row.batches = await api.invOutboundBatches({ schoolId: getCurrentSchoolId() as any, productId: row.productId, canteenId: form.canteenId });
    row.batch = row.batches?.[0]?.inboundId;
  } catch { row.batches = []; row.batch = undefined; }
}
function batchRemain(row: any) {
  const b = (row.batches || []).find((x:any)=> Number(x.inboundId)===Number(row.batch));
  return Number(b?.remain || 0) || 1;
}
async function save() {
  if (!form.date || !form.canteenId) { ElMessage.warning('请选择出库日期和食堂'); return; }
  if (!form.items.length || form.items.some((it:any)=> !it.productId || !it.qty || !it.batch)) { ElMessage.warning('请添加商品、选择批次并填写数量'); return; }
  // Validate qty <= batch remain
  for (const it of form.items) {
    const b = (it.batches || []).find((x:any)=> Number(x.inboundId)===Number(it.batch));
    if (!b) { ElMessage.warning('批次无效'); return; }
    if (Number(it.qty || 0) > Number(b.remain || 0)) { ElMessage.warning('出库数量不能超过该批次剩余'); return; }
  }
  const dateStr = (()=>{ const d=form.date as Date; const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; })();
  for (const it of form.items) {
    await api.invOutboundCreate({
      schoolId: getCurrentSchoolId(),
      productId: it.productId,
      qty: Number(it.qty||0),
      purpose: form.purpose || undefined,
      by: form.by || undefined,
      receiver: form.receiver || undefined,
      canteenId: form.canteenId,
      date: dateStr,
    } as any);
  }
  ElMessage.success('已提交');
  createVisible.value = false;
  load();
}
const onExportCsv = () =>
  exportCsv('出库登记', rows.value, {
    id: 'ID',
    canteenId: '食堂',
    productId: '商品ID',
    qty: '数量',
    purpose: '用途',
    by: '出库人',
    receiver: '领用人',
    at: '出库日期',
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
