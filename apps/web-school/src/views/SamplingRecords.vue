<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>留样记录</span>
        <div class="actions">
          <el-tag :type="sseConnected ? 'success' : 'warning'" effect="plain" size="small">
            设备 {{ sseConnected ? '已连接' : '连接中' }}
          </el-tag>
          <el-button type="primary" @click="openCreate">新建</el-button>
          <el-button @click="onExportCsv">导出记录</el-button>
          <el-button @click="onExportExceptions">导出异常</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" class="filters">
      <el-form-item label="样品">
        <el-input v-model="filters.sample" />
      </el-form-item>
      <el-form-item label="异常">
        <el-select v-model="filters.exception" clearable placeholder="全部" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="仅异常" value="true" />
          <el-option label="仅正常" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="weight" label="重量(g)" width="120" />
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
      <el-table-column prop="duration" label="时长(h)" width="100" />
      <el-table-column prop="by" label="留样人" width="120" />
      <el-table-column prop="cabinet" label="留样柜" width="120" />
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
      <el-table-column prop="measure" label="处理措施" min-width="160">
        <template #default="{ row }">
          <span v-if="!row.exception">-</span>
          <span v-else>{{ row.measure || '未处理' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button v-if="row.exception" size="small" @click="openMeasure(row)"
            >处理措施</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, ->, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>

  <el-dialog v-model="createVisible" title="新建留样记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="样品" required>
        <el-input v-model="form.sample" />
      </el-form-item>
      <el-form-item label="重量(g)" required>
        <el-input-number v-model="form.weight" :min="1" />
      </el-form-item>
      <el-form-item label="图片URL">
        <el-input v-model="form.imageUrl" placeholder="http(s)://..." />
      </el-form-item>
      <el-form-item label="时长(h)" required>
        <el-input-number v-model="form.duration" :min="1" />
      </el-form-item>
      <el-form-item label="留样人" required>
        <el-input v-model="form.by" />
      </el-form-item>
      <el-form-item label="留样柜">
        <el-input v-model="form.cabinet" />
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

const handlePageChange = (p: number) => {
  page.value = p;
  load();
};

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const sseConnected = ref(false);
let es: EventSource | null = null;

const filters = reactive<{
  sample: string;
  exception: '' | 'true' | 'false' | null;
  range: [Date, Date] | null;
}>({ sample: '', exception: '' as any, range: null });

async function load() {
  const params: any = {
    page: page.value,
    pageSize: pageSize.value,
    schoolId: getCurrentSchoolId(),
  };
  if (filters.sample) params.sample = filters.sample;
  if (filters.exception) params.exception = filters.exception;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  try {
    const res = await api.samplingList(params);
    rows.value = res.items;
    total.value = res.total;
  } catch (e) {
    ElMessage.error('加载失败');
  }
}

function applyFilters() {
  page.value = 1;
  load();
}

const createVisible = ref(false);
const form = reactive({ sample: '', weight: 100, imageUrl: '', duration: 48, by: '', cabinet: '' });
function openCreate() {
  form.sample = '';
  form.weight = 100;
  form.imageUrl = '';
  form.duration = 48;
  form.by = '';
  form.cabinet = '';
  createVisible.value = true;
}
async function save() {
  if (!form.sample || !form.by || !form.weight || !form.duration) {
    ElMessage.warning('请完整填写样品、重量、时长、留样人');
    return;
  }
  try {
    await api.samplingCreate({ ...form, schoolId: getCurrentSchoolId() } as any);
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch (e) {
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
  await api.samplingSetMeasure(measureRow.value.id, measureText.value);
  ElMessage.success('已保存处理措施');
  measureVisible.value = false;
  load();
}

function connectSSE() {
  try {
    es = new EventSource(`${API_BASE}/school/sampling/stream`);
    es.onopen = () => (sseConnected.value = true);
    es.onerror = () => (sseConnected.value = false);
    es.addEventListener('sample-created', () => load());
    es.addEventListener('sample-updated', () => load());
    es.addEventListener('cleanup-created', () => load());
  } catch (e) {
    sseConnected.value = false;
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function onExportCsv() {
  exportCsv('留样记录', rows.value, {
    id: 'ID',
    sample: '样品',
    weight: '重量',
    imageUrl: '图片',
    duration: '时长',
    by: '留样人',
    cabinet: '留样柜',
    at: '时间',
    exception: '是否异常',
    measure: '处理措施',
  });
}
function onExportExceptions() {
  const ex = rows.value.filter((r) => r.exception);
  exportCsv('留样异常', ex, {
    id: 'ID',
    sample: '样品',
    weight: '重量',
    at: '时间',
    exceptionReason: '异常原因',
    measure: '处理措施',
  });
}

let off: any = null;
onMounted(() => {
  load();
  connectSSE();
  const h = () => {
    page.value = 1;
    load();
  };
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

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions > * {
  margin-left: 8px;
}
.filters {
  margin-bottom: 8px;
}
.pagination {
  margin-top: 12px;
  text-align: right;
}
</style>
