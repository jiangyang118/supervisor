<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>消毒管理</span>
        <div>
          <el-button @click="onDeviceConnect">设备接入</el-button>
          <el-button type="primary" @click="openCreate">手动录入</el-button>
          <el-button @click="showExceptions">异常处置</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="方式">
        <el-select v-model="filters.method" clearable placeholder="请选择" style="width: 120px">
          <el-option label="酒精" value="酒精" />
          <el-option label="紫外" value="紫外" />
          <el-option label="高温" value="高温" />
        </el-select>
      </el-form-item>
      <el-form-item label="异常">
        <el-select v-model="filters.exception" clearable placeholder="全部" style="width: 120px">
        
          <el-option label="仅异常" value="true" />
          <el-option label="仅正常" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels 
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="-"/>
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows"  border>
      <el-table-column label="消毒日期" width="140"><template #default="{ row }">{{ String(row.at||'').slice(0,10) }}</template></el-table-column>
      <el-table-column label="食堂" min-width="160"><template #default="{ row }">{{ canteenName(row.canteenId) }}</template></el-table-column>
      <el-table-column prop="items" label="消毒区域/物品" min-width="200" />
      <el-table-column prop="method" label="消毒方式" width="120" />
      <el-table-column label="时长/温度（是否达标）" min-width="220">
        <template #default="{ row }">
          <span>{{ row.duration }} 分钟 / {{ row.temperature ?? '-' }} ℃（
            <span :style="{ color: row.exception ? '#F56C6C' : '#67C23A' }">{{ row.exception ? '未达标' : '达标' }}</span>
          ）</span>
        </template>
      </el-table-column>
      <el-table-column prop="responsible" label="责任人" width="140" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button  @click="viewDetail(row)">查看详情</el-button>
          <el-button  @click="onExportOne(row)">导出</el-button>
          <el-button v-if="row.exception"  type="warning" @click="openMeasure(row)">异常处置</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建消毒记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="食堂">
        <el-select v-model="form.canteenId" placeholder="请选择" style="width: 260px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="Number(c.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="方式">
        <el-select v-model="form.method" placeholder="请选择">
          <el-option label="酒精" value="酒精" />
          <el-option label="紫外" value="紫外" />
          <el-option label="高温" value="高温" />
        </el-select>
      </el-form-item>
      <el-form-item label="时长(分钟)">
        <el-input-number v-model="form.duration" :min="1" />
      </el-form-item>
      <el-form-item label="温度(℃)"><el-input-number v-model="form.temperature" :min="0" :precision="2" /></el-form-item>
      <el-form-item label="物品/区域">
        <el-input v-model="form.items" />
      </el-form-item>
      <el-form-item label="责任人"><el-input v-model="form.responsible" placeholder="可选" /></el-form-item>
      <el-form-item label="图片URL">
        <el-input v-model="form.imageUrl" placeholder="http(s)://..." />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存并上报</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="measureVisible" title="处理措施" width="520px">
    <el-input v-model="measureText" type="textarea" :rows="4" placeholder="请输入处理措施" />
    <template #footer>
      <el-button @click="measureVisible = false">取消</el-button>
      <el-button type="primary" @click="saveMeasure">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { useRouter } from 'vue-router';
import { api, API_BASE } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const canteens = ref<any[]>([]);
const sseConnected = ref(false);
let es: EventSource | null = null;

const filters = reactive<{
  method: string | undefined;
  exception: '' | 'true' | 'false' | null;
  range: [Date, Date] | null;
}>({ method: '', exception: '', range: null });
async function load() {
  const params: any = { schoolId: getCurrentSchoolId() };
  if (filters.method) params.method = filters.method;
  if (filters.exception) params.exception = filters.exception;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  try {
    const res = await api.disinfectionList(params);
    rows.value = res.items;
  } catch {
    ElMessage.error('加载失败');
  }
}
function applyFilters() {
  load();
}

const createVisible = ref(false);
const form = reactive<any>({ canteenId: undefined as number|undefined, method: '酒精', duration: 30, temperature: undefined as number|undefined, items: '', responsible: '', imageUrl: '' });
const openCreate = () => {
  form.canteenId = canteens.value[0]?.id ? Number(canteens.value[0].id) : undefined;
  form.method = '酒精';
  form.duration = 30;
  form.temperature = undefined as any;
  form.items = '';
  form.responsible = '';
  form.imageUrl = '';
  createVisible.value = true;
};
async function save() {
  if (!form.method || !form.duration || !form.items) {
    ElMessage.warning('请填写方式、时长与物品');
    return;
  }
  try {
    await api.disinfectionCreate({
      schoolId: getCurrentSchoolId(),
      canteenId: form.canteenId,
      method: form.method,
      duration: form.duration,
      temperature: form.temperature,
      items: form.items,
      responsible: form.responsible || undefined,
      imageUrl: form.imageUrl || undefined,
    });
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  }
}

const measureVisible = ref(false);
const measureText = ref('');
const measureRow = ref<any | null>(null);
function openMeasure(row: any) {
  measureRow.value = row;
  measureText.value = row.measure || '';
  measureVisible.value = true;
}
async function saveMeasure() {
  if (!measureRow.value) return;
  await api.disinfectionSetMeasure(measureRow.value.id, measureText.value);
  ElMessage.success('已保存');
  measureVisible.value = false;
  load();
}

function connectSSE() {
  try {
    es = new EventSource(`${API_BASE}/school/disinfection/stream`);
    es.onopen = () => (sseConnected.value = true);
    es.onerror = () => (sseConnected.value = false);
    es.addEventListener('disinfection-created', () => load());
    es.addEventListener('disinfection-updated', () => load());
  } catch {
    sseConnected.value = false;
  }
}

const onExportCsv = () =>
  exportCsv('消毒记录', rows.value, {
    at: '消毒日期',
    canteenId: '食堂',
    items: '消毒区域/物品',
    method: '消毒方式',
    duration: '时长(分钟)',
    temperature: '温度(℃)',
    exception: '是否达标(0达标/1未达标)',
    responsible: '责任人',
  });
const onExportExceptions = () => {
  const ex = rows.value.filter((r: any) => r.exception);
  exportCsv('消毒异常', ex, {
    at: '消毒日期',
    canteenId: '食堂',
    items: '消毒区域/物品',
    method: '消毒方式',
    duration: '时长(分钟)',
    temperature: '温度(℃)',
    exceptionReason: '异常原因',
    responsible: '责任人',
  });
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function canteenName(id?: number) {
  return canteens.value.find((c:any)=> Number(c.id)===Number(id))?.name || '-';
}
function onExportOne(row: any) {
  exportCsv(`消毒-${row.id}`, [row], { at:'消毒日期', canteenId:'食堂', items:'消毒区域/物品', method:'消毒方式', duration:'时长(分钟)', temperature:'温度(℃)', responsible:'责任人' });
}
const router = useRouter();
function viewDetail(row: any) { router.push({ path: '/disinfection/detail', query: { id: row.id } }); }
function onDeviceConnect() { connectSSE(); ElMessage.success('已尝试连接设备'); }
function showExceptions() { filters.exception = 'true' as any; applyFilters(); }

let off: any = null;
onMounted(() => {
  load();
  api.canteensList(getCurrentSchoolId() as any).then((list)=> canteens.value = list || []).catch(()=> (canteens.value=[]));
  connectSSE();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  es?.close();
  try {
    off?.();
  } catch {}
});
</script>
