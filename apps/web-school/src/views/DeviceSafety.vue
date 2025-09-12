<template>
  <el-card>
    <template #header>
      <div class="header-bar">
        <span class="title">设备安全管理</span>
        <div class="actions">
          <el-button type="primary" @click="openCreate">新增</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-select v-model="canteenId" placeholder="全部食堂" clearable filterable style="width:220px">
        <el-option v-for="c in canteens" :key="String(c.id)" :label="c.name" :value="Number(c.id)" />
      </el-select>
      <el-date-picker v-model="range" style="width:260px;margin:0 20px" type="daterange" unlink-panels range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" :shortcuts="shortcuts" />
      <el-button :loading="loading" @click="load">查询</el-button>
    </div>

    <el-table :data="rows" border stripe  class="ds-table">
      <el-table-column prop="checkDate" label="检查日期" width="160">
        <template #default="{ row }">{{ fmt(row.checkDate) }}</template>
      </el-table-column>
      <el-table-column label="食堂" min-width="160">
        <template #default="{ row }">{{ canteenName(row.canteenId) }}</template>
      </el-table-column>
      <el-table-column prop="deviceName" label="检查设备" min-width="160" />
      <el-table-column label="检查结果" width="120">
        <template #default="{ row }">
          <el-tag :type="row.result === '异常' ? 'danger' : 'success'" effect="light" round >{{ row.result }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handler" label="检查人" width="140" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="viewDetail(row)">查看</el-button>
          <el-button text type="success" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 新增弹窗 -->
  <el-dialog v-model="createVisible" :title="dialogTitle" width="720px">
    <el-form :model="form" label-width="120px" ref="formRef">
      <el-form-item label="检查日期" required>
        <el-date-picker v-model="form.checkDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="食堂">
        <el-select v-model="form.canteenId" placeholder="请选择" clearable filterable style="width:260px">
          <el-option v-for="c in canteens" :key="String(c.id)" :label="c.name" :value="Number(c.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="设备名称" required>
        <el-input v-model="form.deviceName" placeholder="如：燃气灶" />
      </el-form-item>
      <el-form-item label="检查项目" required>
        <el-checkbox-group v-model="form.items">
          <el-checkbox v-for="opt in itemOptions" :key="opt" :label="opt">{{ opt }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="检查结果" required>
        <el-radio-group v-model="form.result">
          <el-radio label="正常">正常</el-radio>
          <el-radio label="异常">异常</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="结果描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简要描述检查情况" />
      </el-form-item>
      <el-form-item v-if="form.result === '异常'" label="处理措施" required>
        <el-input v-model="form.measures" type="textarea" :rows="2" placeholder="异常时必须填写" />
      </el-form-item>
      <el-form-item v-if="form.result === '异常'" label="处理人" required>
        <el-input v-model="form.handler" placeholder="异常时必须填写" />
      </el-form-item>
      <el-form-item label="检查图片">
        <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" @change="onImage">
          <el-button>选择图片</el-button>
        </el-upload>
        <img v-if="form.imageUrl" :src="normUrl(form.imageUrl)" alt="预览" style="height:64px;margin-left:12px" />
      </el-form-item>
      <el-form-item label="检查人签名">
        <div>
          <canvas ref="sigCanvas" width="400" height="120" style="border:1px solid #ccc; border-radius:4px; touch-action:none"></canvas>
          <div style="margin-top:4px">
            <el-button  @click="clearSig">清除</el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" title="检查详情" width="640px">
    <el-descriptions :column="1"  border>
      <el-descriptions-item label="检查日期">{{ fmt(detail?.checkDate) }}</el-descriptions-item>
      <el-descriptions-item label="食堂">{{ canteenName(detail?.canteenId) }}</el-descriptions-item>
      <el-descriptions-item label="设备">{{ detail?.deviceName }}</el-descriptions-item>
      <el-descriptions-item label="项目">{{ detail?.items }}</el-descriptions-item>
      <el-descriptions-item label="结果"><el-tag :type="detail?.result === '异常' ? 'danger' : 'success'">{{ detail?.result }}</el-tag></el-descriptions-item>
      <el-descriptions-item label="描述">{{ detail?.description }}</el-descriptions-item>
      <el-descriptions-item v-if="detail?.result === '异常'" label="处理措施">{{ detail?.measures }}</el-descriptions-item>
      <el-descriptions-item v-if="detail?.result === '异常'" label="处理人">{{ detail?.handler }}</el-descriptions-item>
      <el-descriptions-item label="图片">
        <img v-if="detail?.imageUrl" :src="normUrl(detail?.imageUrl)" alt="图片" style="max-width:100%" />
      </el-descriptions-item>
      <el-descriptions-item label="签名">
        <img v-if="detail?.signatureData" :src="normUrl(detail?.signatureData)" alt="签名" style="max-width:100%" />
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="detailVisible=false">关闭</el-button>
      <el-button type="primary" @click="editFromDetail">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { dateOnly } from '../utils/datetime';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const canteens = ref<Array<{ id: number|string; name: string }>>([]);
const canteenId = ref<number | undefined>(undefined);
const range = ref<[string,string] | null>(null);
const shortcuts = [
  { text: '今天', value: () => { const d=new Date(); const s=new Date(d.getFullYear(),d.getMonth(),d.getDate()); const e=new Date(d.getFullYear(),d.getMonth(),d.getDate()); return [s,e] as [Date,Date]; }},
  { text: '近7天', value: () => { const e=new Date(); const s=new Date(e); s.setDate(s.getDate()-6); return [s,e] as [Date,Date]; }},
  { text: '近30天', value: () => { const e=new Date(); const s=new Date(e); s.setDate(s.getDate()-29); return [s,e] as [Date,Date]; }},
];

function fmt(iso?: string) { return dateOnly(iso); }
function canteenName(id?: number) { return canteens.value.find((c:any)=> Number(c.id)===Number(id))?.name || '-'; }

async function load() {
  loading.value = true;
  try {
    const params: any = { schoolId: getCurrentSchoolId() };
    if (canteenId.value) params.canteenId = canteenId.value;
    if (range.value && range.value.length === 2) { params.start = range.value[0]; params.end = range.value[1]; }
    const res = await api.deviceSafetyList(params);
    rows.value = res.items || [];
  } finally { loading.value = false; }
}

// Create dialog
const createVisible = ref(false);
const form = reactive<{ checkDate: string | ''; canteenId?: number; deviceName: string; items: string[]; result: '正常'|'异常'; description?: string; measures?: string; handler?: string; imageUrl?: string; signatureData?: string }>({
  checkDate: '',
  canteenId: undefined,
  deviceName: '',
  items: [],
  result: '正常',
  description: '',
  measures: '',
  handler: '',
  imageUrl: '',
  signatureData: '',
});
const itemOptions = ['管道漏气', '点火正常', '清洁情况'];
const sigCanvas = ref<HTMLCanvasElement | null>(null);
let drawing = false; let ctx: CanvasRenderingContext2D | null = null;
const sigDirty = ref(false);
const editingId = ref<number | null>(null);
const dialogTitle = computed(() => (editingId.value ? '编辑设备安全检查' : '新增设备安全检查'));
function openCreate() {
  form.checkDate = new Date().toISOString().slice(0,10);
  form.canteenId = undefined; form.deviceName=''; form.items=[]; form.result='正常'; form.description=''; form.measures=''; form.handler=''; form.imageUrl=''; form.signatureData='';
  editingId.value = null;
  createVisible.value = true;
  setTimeout(initCanvas, 0);
}
function initCanvas() {
  const c = sigCanvas.value; if (!c) return;
  ctx = c.getContext('2d');
  sigDirty.value = false;
  const start = (x:number,y:number)=>{ drawing=true; sigDirty.value = true; ctx!.beginPath(); ctx!.moveTo(x,y); };
  const move = (x:number,y:number)=>{ if(!drawing) return; ctx!.lineWidth=2; ctx!.lineCap='round'; ctx!.strokeStyle='#333'; ctx!.lineTo(x,y); ctx!.stroke(); };
  const end = ()=>{ drawing=false; };
  const getPos = (e:any) => {
    const rect = c.getBoundingClientRect();
    const clientX = e.touches? e.touches[0].clientX : e.clientX;
    const clientY = e.touches? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  c.onmousedown = (e)=>{ const p=getPos(e); start(p.x,p.y); };
  c.onmousemove = (e)=>{ const p=getPos(e); move(p.x,p.y); };
  c.onmouseup = end; c.onmouseleave = end;
  c.ontouchstart = (e)=>{ const p=getPos(e); start(p.x,p.y); };
  c.ontouchmove = (e)=>{ const p=getPos(e); move(p.x,p.y); e.preventDefault(); };
  c.ontouchend = end;
}
function clearSig() { const c = sigCanvas.value; if (!c) return; const cx = c.getContext('2d'); cx?.clearRect(0,0,c.width,c.height); }

function normUrl(u?: string) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  if (s.startsWith('/')) {
    const w: any = window as any;
    const base = (w.API_BASE || w.BASE || '').toString();
    if (base) return base.replace(/\/$/, '') + s;
    return window.location.origin.replace(/\/$/, '') + s;
  }
  return s;
}

function onImage(fileEvt: any) {
  const file = fileEvt?.raw || fileEvt?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { form.imageUrl = String(reader.result || ''); };
  reader.readAsDataURL(file);
}

async function save() {
  if (!form.checkDate || !form.deviceName || !form.items.length) {
    ElMessage.warning('请填写必填项（日期、设备、检查项目）');
    return;
  }
  if (form.result === '异常' && (!form.measures || !form.handler)) {
    ElMessage.warning('异常必须填写处理措施与处理人');
    return;
  }
  try {
    saving.value = true;
    // grab signature
    const c = sigCanvas.value;
    if (sigDirty.value && c) {
      form.signatureData = c.toDataURL('image/png');
    }
    if (editingId.value) {
      await api.deviceSafetyUpdate(editingId.value, {
        canteenId: form.canteenId,
        deviceName: form.deviceName,
        items: form.items,
        result: form.result,
        description: form.description || null,
        measures: form.measures || null,
        handler: form.handler || null,
        imageUrl: form.imageUrl || null,
        signatureData: form.signatureData || null,
        checkDate: form.checkDate ? form.checkDate + 'T00:00:00' : undefined,
      });
    } else {
      await api.deviceSafetyCreate({
        schoolId: getCurrentSchoolId(),
        canteenId: form.canteenId,
        deviceName: form.deviceName,
        items: form.items,
        result: form.result,
        description: form.description || undefined,
        measures: form.measures || undefined,
        handler: form.handler || undefined,
        imageUrl: form.imageUrl || undefined,
        signatureData: form.signatureData || undefined,
        checkDate: form.checkDate + 'T00:00:00',
      });
    }
    ElMessage.success('已保存');
    createVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error('保存失败');
  } finally { saving.value = false; }
}

const detailVisible = ref(false);
const detail = ref<any>(null);
async function viewDetail(row: any) {
  try {
    const d = await api.deviceSafetyDetail(row.id);
    detail.value = d;
    detailVisible.value = true;
  } catch { ElMessage.error('加载详情失败'); }
}

async function openEdit(row: any) {
  try {
    const d = await api.deviceSafetyDetail(row.id);
    editingId.value = Number(d.id);
    form.checkDate = fmt(d.checkDate);
    form.canteenId = d.canteenId ? Number(d.canteenId) : undefined;
    form.deviceName = d.deviceName || '';
    form.items = String(d.items || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s);
    form.result = d.result === '异常' ? '异常' : '正常';
    form.description = d.description || '';
    form.measures = d.measures || '';
    form.handler = d.handler || '';
    form.imageUrl = d.imageUrl || '';
    form.signatureData = d.signatureData || '';
    createVisible.value = true;
    setTimeout(initCanvas, 0);
  } catch { ElMessage.error('加载详情失败'); }
}

// 导出功能已移除

function editFromDetail() {
  if (!detail.value) return;
  createVisible.value = false;
  detailVisible.value = false;
  openEdit(detail.value);
}

onMounted(() => {
  api.canteensList(String(getCurrentSchoolId())).then((list)=> { canteens.value = list || []; }).catch(()=> { canteens.value = []; });
  load();
  const h = () => { load(); api.canteensList(String(getCurrentSchoolId())).then((list)=> canteens.value = list || []).catch(()=> canteens.value = []); };
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
});
</script>

<style scoped>
.header-bar { display: flex; align-items: center; justify-content: space-between; }
.title { font-weight: 600; }
.filter-bar { margin-bottom: 8px;}
.ds-table :deep(.el-table__cell) { padding: 8px 12px; }
</style>
