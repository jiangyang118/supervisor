<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>晨检管理</span>
        <div class="actions">
          <el-tag :type="sseConnected ? 'success' : 'warning'" effect="plain" size="small">
            晨检仪 {{ sseConnected ? '已连接' : '连接中' }}
          </el-tag>
          <el-button type="primary" @click="openCreate">录入晨检</el-button>
          <el-button @click="onExportCsv">导出台账</el-button>
          <el-button @click="onExportExceptions">导出异常</el-button>
        </div>
      </div>
    </template>

    <el-form :inline="true" :model="filters" class="filters">
      <el-form-item label="人员">
        <el-input v-model="filters.staff" placeholder="姓名/工号" />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="filters.result" clearable style="width: 120px">
          <el-option label="正常" value="正常" />
          <el-option label="异常" value="异常" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker
          v-model="filters.range"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="staff" label="人员" />
      <el-table-column prop="temp" label="体温(℃)" width="120" />
      <el-table-column label="结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.result === '正常' ? 'success' : 'danger'" effect="plain">{{
            row.result
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="来源" width="100" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.at) }}</template>
      </el-table-column>
      <el-table-column prop="measure" label="处理措施" min-width="200">
        <template #default="{ row }">
          <span v-if="row.result === '正常'">-</span>
          <span v-else>{{ row.measure || '未处理' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="row.result === '异常'" size="small" @click="openMeasure(row)"
            >处理措施</el-button
          >
          <el-button size="small" type="danger" text @click="remove(row.id)">删除</el-button>
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

  <el-dialog v-model="createVisible" title="录入晨检" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="人员" required>
        <el-input v-model="form.staff" placeholder="请输入人员姓名或工号" />
      </el-form-item>
      <el-form-item label="体温(℃)" required>
        <el-input-number v-model="form.temp" :precision="1" :step="0.1" :min="34" :max="42" />
      </el-form-item>
      <el-form-item label="判定">
        <el-tag :type="form.temp >= 37.3 ? 'danger' : 'success'" effect="plain">
          {{ form.temp >= 37.3 ? '异常' : '正常' }}
        </el-tag>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存并上报</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="measureVisible" title="处理措施" width="520px">
    <el-input
      v-model="measureText"
      type="textarea"
      :rows="4"
      placeholder="请输入处理措施，如：已立即就医并居家观察等"
    />
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
import { ElMessage } from 'element-plus';

type Row = {
  id: string;
  staff: string;
  temp: number;
  result: '正常' | '异常';
  at: string;
  source: 'manual' | 'device';
  measure?: string;
};

const rows = ref<Row[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const sseConnected = ref(false);
let es: EventSource | null = null;

// 处理分页变化
function handlePageChange(p: number) {
  page.value = p;
  load();
}

const filters = reactive<{
  staff: string;
  result: '' | '正常' | '异常' | null;
  range: [Date, Date] | null;
}>({ staff: '', result: '正常', range: null });

async function load() {
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filters.staff) params.staff = filters.staff;
    if (filters.result) params.result = filters.result;
    if (filters.range && filters.range.length === 2) {
      params.start = filters.range[0].toISOString();
      params.end = filters.range[1].toISOString();
    }
    const res = await api.morningList(params);
    rows.value = res.items;
    total.value = res.total;
  } catch (e) {
    console.error(e);
    ElMessage.error('加载晨检数据失败');
  }
}

function applyFilters() {
  page.value = 1;
  load();
}

const createVisible = ref(false);
const form = reactive({ staff: '', temp: 36.5 });
function openCreate() {
  form.staff = '';
  form.temp = 36.5;
  createVisible.value = true;
}
async function save() {
  if (!form.staff || !form.temp) {
    ElMessage.warning('请填写人员与体温');
    return;
  }
  try {
    await api.morningCreate({ staff: form.staff, temp: form.temp });
    createVisible.value = false;
    ElMessage.success('已保存并上报');
    load();
  } catch (e) {
    ElMessage.error('保存失败');
  }
}

async function remove(id: string) {
  await api.morningDelete(id);
  ElMessage.success('已删除');
  load();
}

const measureVisible = ref(false);
const measureText = ref('');
const measureRow = ref<Row | null>(null);
function openMeasure(row: Row) {
  measureRow.value = row;
  measureText.value = row.measure || '';
  measureVisible.value = true;
}
async function saveMeasure() {
  if (!measureRow.value) return;
  await api.morningSetMeasure(measureRow.value.id, measureText.value);
  ElMessage.success('处理措施已保存');
  measureVisible.value = false;
  load();
}

function connectSSE() {
  try {
    es = new EventSource(`${API_BASE}/school/morning-checks/stream`);
    es.onopen = () => {
      sseConnected.value = true;
    };
    es.onerror = () => {
      sseConnected.value = false;
    };
    es.addEventListener('created', (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (!filters.result || data.result === filters.result) {
        rows.value.unshift(data);
        total.value += 1;
      }
    });
    es.addEventListener('deleted', (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      rows.value = rows.value.filter((r) => r.id !== data.id);
      total.value = Math.max(0, total.value - 1);
    });
    es.addEventListener('updated', (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      const i = rows.value.findIndex((r) => r.id === data.id);
      if (i !== -1) rows.value[i] = data;
    });
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
  exportCsv('晨检台账', rows.value, {
    id: 'ID',
    staff: '人员',
    temp: '体温',
    result: '结果',
    at: '时间',
    source: '来源',
    measure: '处理措施',
  });
}
function onExportExceptions() {
  const ex = rows.value.filter((r) => r.result === '异常');
  exportCsv('晨检异常', ex, {
    id: 'ID',
    staff: '人员',
    temp: '体温',
    at: '时间',
    measure: '处理措施',
  });
}

onMounted(() => {
  load();
  connectSSE();
});
onBeforeUnmount(() => {
  es?.close();
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
