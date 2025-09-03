<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>消毒管理</span>
        <div>
          <el-tag :type="sseConnected ? 'success' : 'warning'" effect="plain" size="small"
            >设备 {{ sseConnected ? '已连接' : '连接中' }}</el-tag
          >
          <el-button type="primary" @click="openCreate">新建</el-button>
          <el-button @click="onExportCsv">导出记录</el-button>
          <el-button @click="onExportExceptions">导出异常</el-button>
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
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="160" />
      <el-table-column prop="method" label="方式" width="120" />
      <el-table-column prop="duration" label="时长(分钟)" width="120" />
      <el-table-column prop="items" label="物品/区域" />
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.imageUrl"
            :src="row.imageUrl"
            :preview-src-list="[row.imageUrl]"
            style="width: 64px; height: 48px; object-fit: cover"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.exception ? 'danger' : 'success'" effect="plain">{{
            row.exception ? '异常' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.at) }}</template>
      </el-table-column>
      <el-table-column prop="measure" label="处理措施" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button v-if="row.exception" size="small" @click="openMeasure(row)"
            >处理措施</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建消毒记录" width="520px">
    <el-form :model="form" label-width="96px">
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
      <el-form-item label="物品/区域">
        <el-input v-model="form.items" />
      </el-form-item>
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
import { api, API_BASE } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
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
const form = reactive({ method: '酒精', duration: 30, items: '', imageUrl: '' });
const openCreate = () => {
  form.method = '酒精';
  form.duration = 30;
  form.items = '';
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
      method: form.method,
      duration: form.duration,
      items: form.items,
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
    id: 'ID',
    method: '方式',
    duration: '时长',
    items: '物品',
    imageUrl: '图片',
    exception: '是否异常',
    measure: '处理措施',
    at: '时间',
  });
const onExportExceptions = () => {
  const ex = rows.value.filter((r: any) => r.exception);
  exportCsv('消毒异常', ex, {
    id: 'ID',
    method: '方式',
    duration: '时长',
    items: '物品',
    at: '时间',
    exceptionReason: '异常原因',
    measure: '处理措施',
  });
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

let off: any = null;
onMounted(() => {
  load();
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
