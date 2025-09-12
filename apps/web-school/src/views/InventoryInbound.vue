<template>
<div>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>入库登记</span>
        <div>
          <el-button type="primary" @click="openCreate">新增入库</el-button>
          <el-button @click="onExportCsv">导出 </el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" border>
      <el-table-column prop="docNo" label="入库单号" width="180" />
      <el-table-column label="入库日期" width="160">
        <template #default="{ row }">{{ dateOnly(row.date) }}</template>
      </el-table-column>
      <el-table-column label="食堂" min-width="160"><template #default="{ row }">{{ canteenName(row.canteenId) }}</template></el-table-column>
      <el-table-column label="供应商" min-width="160"><template #default="{ row }">{{ supplierName(row.supplierId) }}</template></el-table-column>
      <el-table-column label="入库商品" min-width="240">
        <template #default="{ row }">
          <span class="ellipsis" :title="row.productNames || '-'">{{ row.productNames || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalQty" label="入库数量" width="120" />
      <el-table-column prop="kinds" label="商品种类数" width="120" />
      <el-table-column prop="operator" label="操作人" width="140" />
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button text  @click="openDetail(row)" type="primary">查看</el-button>
          <el-button text  @click="openEdit(row)" type="success">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-drawer v-model="detailVisible" title="入库详情" size="60%">
    <div v-if="detail.head">
      <el-descriptions :column="2"  border>
        <el-descriptions-item label="入库单号">{{ detail.head.docNo }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ dateOnly(detail.head.date) }}</el-descriptions-item>
        <el-descriptions-item label="食堂">{{ canteenName(detail.head.canteenId) }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ supplierName(detail.head.supplierId) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.head.operator || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">商品明细</el-divider>
      <el-table :data="detail.items" border >
        <el-table-column prop="productName" label="商品" />
        <el-table-column prop="qty" label="数量" width="200" />
        <el-table-column prop="unitPrice" label="单价(元)" width="140" />
        <el-table-column label="生产日期" width="160">
          <template #default="{ row }">{{ dateOnly(row.prodDate) }}</template>
        </el-table-column>
        <el-table-column prop="shelfLifeDays" label="保质期(天)" width="140" />
        <el-table-column label="小计(元)" width="140">
          <template #default="{ row }">{{ (((row.qty||0)*(row.unitPrice||0)) || 0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <el-divider content-position="left">票证</el-divider>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <el-image v-for="(a,idx) in (detail.attachments||[]).filter((x:any)=>x.type==='ticket_quarantine')" :key="'q'+idx" :src="normUrl(a.imageUrl)" style="width:120px;height:90px" fit="cover" />
        <el-image v-for="(a,idx) in (detail.attachments||[]).filter((x:any)=>x.type==='ticket_invoice')" :key="'i'+idx" :src="normUrl(a.imageUrl)" style="width:120px;height:90px" fit="cover" />
        <el-image v-for="(a,idx) in (detail.attachments||[]).filter((x:any)=>x.type==='ticket_receipt')" :key="'r'+idx" :src="normUrl(a.imageUrl)" style="width:120px;height:90px" fit="cover" />
      </div>
      <el-divider content-position="left">入库影像</el-divider>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <el-image v-for="(a,idx) in (detail.attachments||[]).filter((x:any)=>x.type==='image')" :key="'img'+idx" :src="normUrl(a.imageUrl)" style="width:120px;height:90px" fit="cover" />
      </div>
    </div>
  </el-drawer>

  <el-drawer v-model="createVisible" :title="formMode==='edit' ? '编辑入库' : '新增入库'" size="80%" :with-header="true">
    <div class="drawer-body-scroll">
    <el-form :model="form" label-width="120px">
      <el-form-item label="入库日期">
        <el-date-picker v-model="form.date" type="date" />
      </el-form-item>
      <el-form-item label="食堂">
        <el-select v-model="form.canteenId" placeholder="请选择" style="width: 260px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="Number(c.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="供应商">
        <div style="display:flex;align-items:center;gap:8px">
          <el-select v-model="form.supplierId" placeholder="请选择" style="width: 260px">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-tag v-if="form.supplierId" :type="supplierStatus(form.supplierId).type" effect="plain">{{ supplierStatus(form.supplierId).text }}</el-tag>
        </div>
      </el-form-item>
      <el-form-item label="操作人">
        <el-input v-model="form.operator" placeholder="可选" style="width: 260px" />
      </el-form-item>

      <el-divider content-position="left">商品明细</el-divider>
      <div style="margin-bottom:8px">
        <el-button type="primary" text @click="addItem">+ 添加商品</el-button>
      </div>
      <el-table :data="form.items" border show-summary :summary-method="itemsSummary" style="width:100%" :max-height="tableMaxH" :fit="false" table-layout="auto">
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <el-select v-model="row.productId" filterable placeholder="选择商品" style="width:100%">
              <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="180">
          <template #default="{ row }"><el-input-number v-model="row.qty" :min="1" /></template>
        </el-table-column>
        <el-table-column label="单价(元)" width="140">
          <template #default="{ row }"><el-input v-model.number="row.unitPrice" /></template>
        </el-table-column>
        <el-table-column label="生产日期" width="200">
          <template #default="{ row }"><el-date-picker v-model="row.prodDate" type="date" placeholder="选择日期" /></template>
        </el-table-column>
        <el-table-column label="保质期(天)" width="180">
          <template #default="{ row }"><el-input-number v-model.number="row.shelfLifeDays" :min="0" /></template>
        </el-table-column>
        <el-table-column label="小计(元)" width="140">
          <template #default="{ row }">{{ (((row.qty||0)*(row.unitPrice||0)) || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ $index }"><el-button type="danger" text @click="removeItem($index)">删除</el-button></template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">票证上传（必传）</el-divider>
      <el-form-item label="检疫合格证">
        <el-upload list-type="picture-card" :file-list="ticketFileList('ticket_quarantine')" :limit="1"
                   :on-remove="(f)=>removeTicketByFile('ticket_quarantine', f)"
                   :http-request="(req:any)=>uploadTicketType(req,'ticket_quarantine')">
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="发票">
        <el-upload list-type="picture-card" :file-list="ticketFileList('ticket_invoice')" :limit="1"
                   :on-remove="(f)=>removeTicketByFile('ticket_invoice', f)"
                   :http-request="(req:any)=>uploadTicketType(req,'ticket_invoice')">
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="收货单">
        <el-upload list-type="picture-card" :file-list="ticketFileList('ticket_receipt')" :limit="1"
                   :on-remove="(f)=>removeTicketByFile('ticket_receipt', f)"
                   :http-request="(req:any)=>uploadTicketType(req,'ticket_receipt')">
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-divider content-position="left">入库影像（可选）</el-divider>
      <el-upload list-type="picture-card" :file-list="imageFileList" multiple
                 :on-remove="removeImageByFile" :http-request="uploadImageCard">
        <el-icon><Plus /></el-icon>
      </el-upload>

    </el-form>
    </div>
    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 0">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="save">{{ formMode==='edit' ? '保存修改' : '提交' }}</el-button>
      </div>
    </template>
  </el-drawer>
</div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';
import { Plus } from '@element-plus/icons-vue';
import { dateOnly } from '../utils/datetime';
const rows = ref<any[]>([]);
const products = ref<any[]>([]);
const suppliers = ref<any[]>([]);
const canteens = ref<any[]>([]);
function productName(id: any) {
  return products.value.find((p: any) => String(p.id) === String(id))?.name || '-';
}
function supplierName(id?: any) {
  return suppliers.value.find((s: any) => String(s.id) === String(id))?.name || '-';
}
function canteenName(id?: number) { return canteens.value.find((c:any)=> Number(c.id)===Number(id))?.name || '-'; }
function supplierStatus(id?: string) {
  const s = suppliers.value.find((x:any)=> String(x.id)===String(id));
  if (!s) return { text: '-', type: 'info' } as any;
  const toTs = (v?: string) => v ? new Date(v).getTime() : undefined;
  const biz = toTs(s.licenseExpireAt);
  const food = toTs(s.foodLicenseExpireAt);
  const cand = [biz, food].filter((t:any)=> typeof t==='number') as number[];
  if (!cand.length) return { text: '有效', type: 'success' } as any;
  const minTs = Math.min(...cand);
  const days = Math.ceil((minTs - Date.now())/86400000);
  if (days < 0) return { text: '过期', type: 'danger' } as any;
  if (days <= 30) return { text: '临期', type: 'warning' } as any;
  return { text: '有效', type: 'success' } as any;
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
async function load() {
  // Use doc-level summary to include productNames/totalQty/kinds
  rows.value = await api.invInboundDocs(getCurrentSchoolId());
  products.value = await api.invProducts(getCurrentSchoolId());
  const result = await api.invSuppliers({ schoolId: getCurrentSchoolId() });
  suppliers.value = result.items;
  try { canteens.value = await api.canteensList(String(getCurrentSchoolId())); } catch { canteens.value = []; }
}
const createVisible = ref(false);
const formMode = ref<'create'|'edit'>('create');
let editingDocNo: string | null = null;
const form = reactive<any>({
  date: new Date(),
  canteenId: undefined as number|undefined,
  supplierId: undefined as string|undefined,
  operator: '',
  items: [] as Array<{ productId: string; qty: number; unitPrice?: number; prodDate?: string; shelfLifeDays?: number }>,
  tickets: [] as Array<{ type: 'ticket_quarantine'|'ticket_invoice'|'ticket_receipt'; imageUrl: string }>,
  images: [] as string[],
});
function addTicket() {
  form.tickets.push({ type: 'ticket_quarantine', imageUrl: '' });
}
function removeTicket(i: number) { form.tickets.splice(i,1); }
function addImage() { form.images.push(''); }
function removeImage(i: number) { form.images.splice(i,1); }
const openCreate = () => {
  formMode.value = 'create';
  editingDocNo = null;
  form.date = new Date();
  form.canteenId = canteens.value[0]?.id ? Number(canteens.value[0].id) : undefined;
  form.supplierId = suppliers.value[0]?.id;
  form.operator = '';
  form.items = [];
  form.tickets = [];
  form.images = [];
  addItem();
  createVisible.value = true;
};

async function openEdit(row: any) {
  if (!row?.docNo) { ElMessage.warning('缺少入库单号，无法编辑'); return; }
  try {
    const res = await api.invInboundDocDetail(row.docNo);
    formMode.value = 'edit';
    editingDocNo = row.docNo;
    const head = res?.head || {};
    form.date = head.date ? new Date(head.date) : new Date();
    form.canteenId = head.canteenId ? Number(head.canteenId) : undefined;
    form.supplierId = head.supplierId;
    form.operator = head.operator || '';
    form.items = (res?.items || []).map((it:any)=> ({
      productId: it.productId || '',
      qty: Number(it.qty || 0),
      unitPrice: it.unitPrice ?? undefined,
      prodDate: it.prodDate || undefined,
      shelfLifeDays: it.shelfLifeDays ?? undefined,
    }));
    const atts = Array.isArray(res?.attachments) ? res.attachments : [];
    form.tickets = atts.filter((a:any)=> a.type==='ticket_quarantine' || a.type==='ticket_invoice' || a.type==='ticket_receipt')
      .map((a:any)=> ({ type: a.type, imageUrl: a.imageUrl }));
    form.images = atts.filter((a:any)=> a.type==='image').map((a:any)=> a.imageUrl);
    createVisible.value = true;
  } catch {
    ElMessage.error('加载单据失败，无法编辑');
  }
}
function addItem() {
  form.items.push({ productId: products.value[0]?.id || '', qty: 1 });
}
function removeItem(i: number) { form.items.splice(i,1); }
function normUrl(u?: string) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) {
    const w: any = window as any;
    const base = (w.API_BASE || w.BASE || '').toString();
    if (base) return base.replace(/\/$/, '') + s;
    return window.location.origin.replace(/\/$/, '') + s;
  }
  return s;
}
async function uploadTicket(req: any, idx: number) {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onprogress = (e: any) => {
    if (e.lengthComputable) req.onProgress && req.onProgress({ percent: Math.round((e.loaded / e.total) * 100) });
  };
  reader.onload = async () => {
    try {
      const content = reader.result as string; // dataURL
      const { url } = await api.uploadFile(file.name, content);
      form.tickets[idx].imageUrl = url;
      req.onSuccess && req.onSuccess({ url });
    } catch (e) { req.onError && req.onError(e); }
  };
  reader.onerror = () => req.onError && req.onError(new Error('read error'));
  reader.readAsDataURL(file);
}
async function uploadImage(req: any, idx: number) {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onprogress = (e: any) => {
    if (e.lengthComputable) req.onProgress && req.onProgress({ percent: Math.round((e.loaded / e.total) * 100) });
  };
  reader.onload = async () => {
    try {
      const content = reader.result as string;
      const { url } = await api.uploadFile(file.name, content);
      form.images[idx] = url;
      req.onSuccess && req.onSuccess({ url });
    } catch (e) { req.onError && req.onError(e); }
  };
  reader.onerror = () => req.onError && req.onError(new Error('read error'));
  reader.readAsDataURL(file);
}
function ticketFileList(type: 'ticket_quarantine'|'ticket_invoice'|'ticket_receipt') {
  return (form.tickets || []).filter((t:any)=> t.type===type && String(t.imageUrl||'').trim()).map((t:any, i:number)=>({ name: `${type}-${i}`, url: normUrl(t.imageUrl) }));
}
function removeTicketByFile(type: 'ticket_quarantine'|'ticket_invoice'|'ticket_receipt', file: any) {
  const url = String(file?.url || '');
  const idx = (form.tickets || []).findIndex((t:any)=> t.type===type && normUrl(t.imageUrl)===url);
  if (idx >= 0) form.tickets.splice(idx,1);
}
async function uploadTicketType(req: any, type: 'ticket_quarantine'|'ticket_invoice'|'ticket_receipt') {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onprogress = (e: any) => { if (e.lengthComputable) req.onProgress && req.onProgress({ percent: Math.round((e.loaded/e.total)*100) }); };
  reader.onload = async () => {
    try {
      const { url } = await api.uploadFile(file.name, reader.result as string);
      // replace existing same type
      const idx = (form.tickets || []).findIndex((t:any)=> t.type===type);
      if (idx >= 0) form.tickets.splice(idx,1);
      form.tickets.push({ type, imageUrl: url });
      req.onSuccess && req.onSuccess({ url });
    } catch (e) { req.onError && req.onError(e); }
  };
  reader.onerror = () => req.onError && req.onError(new Error('read error'));
  reader.readAsDataURL(file);
}
const imageFileList = computed(()=> (form.images || []).filter((u:string)=> String(u).trim()).map((u:string, i:number)=>({ name: `image-${i}`, url: normUrl(u) })) );
function removeImageByFile(file: any) {
  const url = String(file?.url || '');
  const idx = (form.images || []).findIndex((u:string)=> normUrl(u)===url);
  if (idx >= 0) form.images.splice(idx,1);
}
async function uploadImageCard(req: any) {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onprogress = (e: any) => { if (e.lengthComputable) req.onProgress && req.onProgress({ percent: Math.round((e.loaded/e.total)*100) }); };
  reader.onload = async () => {
    try {
      const { url } = await api.uploadFile(file.name, reader.result as string);
      form.images.push(url);
      req.onSuccess && req.onSuccess({ url });
    } catch (e) { req.onError && req.onError(e); }
  };
  reader.onerror = () => req.onError && req.onError(new Error('read error'));
  reader.readAsDataURL(file);
}
function itemsSummary({ columns, data }: any) {
  const totalQty = data.reduce((s:number,r:any)=> s + Number(r.qty||0), 0);
  const totalAmt = data.reduce((s:number,r:any)=> s + Number(r.qty||0)*Number(r.unitPrice||0), 0);
  return columns.map((col:any) => {
    if (col.label==='商品') return '合计';
    if (col.label==='数量') return totalQty;
    if (col.label==='小计(元)') return totalAmt.toFixed(2);
    return '';
  });
}
async function save() {
  if (!form.date || !form.canteenId || !form.supplierId) {
    ElMessage.warning('请选择入库日期、食堂和供应商'); return;
  }
  if (!form.items.length || form.items.some((it:any)=> !it.productId || !it.qty)) { ElMessage.warning('请添加商品并填写数量'); return; }
  const validTickets = (form.tickets || []).filter((t:any)=> t.type && String(t.imageUrl||'').trim());
  const types = new Set(validTickets.map((t:any)=>t.type));
  if (!types.has('ticket_quarantine') || !(types.has('ticket_invoice') || types.has('ticket_receipt'))) { ElMessage.warning('请上传检疫合格证与发票/收货单照片'); return; }
  const payload = {
    schoolId: getCurrentSchoolId(),
    // Send date as YYYY-MM-DD to avoid timezone shifts
    date: (() => { const d = form.date as Date; const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; })(),
    canteenId: form.canteenId,
    supplierId: form.supplierId,
    operator: form.operator || undefined,
    // Normalize item.production date to YYYY-MM-DD as well
    items: form.items.map((it:any)=> ({
      productId: it.productId,
      qty: Number(it.qty || 0),
      unitPrice: it.unitPrice ?? undefined,
      prodDate: (() => {
        if (!it.prodDate) return undefined;
        const d = new Date(it.prodDate);
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${dd}`;
      })(),
      shelfLifeDays: it.shelfLifeDays ?? undefined,
    })),
    tickets: validTickets,
    images: form.images,
  } as any;
  if (formMode.value === 'edit' && editingDocNo) {
    await api.invInboundUpdateDoc(editingDocNo, payload);
    ElMessage.success('已保存修改');
  } else {
    await api.invInboundCreateDoc(payload);
    ElMessage.success('已提交');
  }
  createVisible.value = false;
  load();
}

const tableMaxH = computed(() => Math.max(260, Math.floor(window.innerHeight * 0.5)));
const onExportCsv = () =>
  exportCsv('入库登记(单据汇总)', rows.value, {
    docNo: '入库单号',
    date: '入库日期',
    canteenId: '食堂',
    supplierId: '供应商',
    productNames: '入库商品',
    totalQty: '入库数量',
    kinds: '商品种类数',
    operator: '操作人',
  });
function onExportDoc(row: any) {
  exportCsv(`入库-${row.docNo}`, [row], {
    docNo: '入库单号',
    date: '入库日期',
    canteenId: '食堂',
    supplierId: '供应商',
    productNames: '入库商品',
    totalQty: '入库数量',
    kinds: '商品种类数',
    operator: '操作人',
  });
}
let off: any = null;
const detailVisible = ref(false);
const detail = reactive<any>({ head: null, items: [], attachments: [] });
async function openDetail(row: any) {
  if (!row.docNo) { ElMessage.warning('该记录没有单据号，无法查看单据详情'); return; }
  try {
    const res = await api.invInboundDocDetail(row.docNo);
    Object.assign(detail, res || { head: null, items: [], attachments: [] });
    detailVisible.value = true;
  } catch { ElMessage.error('加载详情失败'); }
}
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

<style scoped>
.drawer-body-scroll { max-height: calc(100vh - 210px); overflow: auto; padding-right: 4px; }
</style>
