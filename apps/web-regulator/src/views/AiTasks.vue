<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>巡查任务</span>
        <div>
          <el-button type="primary" @click="openCreate">发布任务</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="状态">
        <el-radio-group v-model="filters.status" size="small">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="待处理">待处理</el-radio-button>
          <el-radio-button label="进行中">进行中</el-radio-button>
          <el-radio-button label="已完成">已完成</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="任务ID" width="140" />
      <el-table-column prop="name" label="任务名称" />
      <el-table-column prop="method" label="巡查方式" width="140" />
      <el-table-column label="巡查事项">
        <template #default="{ row }">{{ (row.items || []).join('、') }}</template>
      </el-table-column>
      <el-table-column label="巡查时段" width="220">
        <template #default="{ row }"
          >{{ row.period?.start || '-' }} ~ {{ row.period?.end || '-' }}</template
        >
      </el-table-column>
      <el-table-column label="巡查学校">
        <template #default="{ row }">{{ (row.schools || []).join(', ') }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button v-if="row.status === '待处理'" size="small" @click="setStatus(row, '进行中')"
            >开始</el-button
          >
          <el-button v-if="row.status !== '已完成'" size="small" @click="setStatus(row, '已完成')"
            >完成</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog
    v-model="createVisible"
    :title="editing ? '编辑巡查任务' : '发布巡查任务'"
    width="640px"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="任务名称"
        ><el-input v-model="form.name" placeholder="如：后厨从业规范专项巡查"
      /></el-form-item>
      <el-form-item label="巡查事项">
        <el-select v-model="form.items" multiple filterable placeholder="选择违规类型">
          <el-option v-for="t in types" :key="t.code" :label="t.label" :value="t.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="巡查方式">
        <el-select v-model="form.method" placeholder="请选择巡查方式">
          <el-option v-for="m in methods" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
      <el-form-item label="巡查时段">
        <el-date-picker
          v-model="form.range"
          type="datetimerange"
          start-placeholder="开始"
          end-placeholder="结束"
        />
      </el-form-item>
      <el-form-item label="巡查学校">
        <el-select v-model="form.schools" multiple filterable placeholder="选择学校">
          <el-option
            v-for="s in schools"
            :key="s.id"
            :label="s.name + (s.linked ? '' : '（未联动）')"
            :value="s.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
const types = ref<Array<{ code: string; label: string }>>([]);
const schools = ref<Array<{ id: string; name: string }>>([]);
const rows = ref<any[]>([]);
const filters = reactive<{
  status: '' | '待处理' | '进行中' | '已完成';
  range: [Date, Date] | null;
}>({ status: '', range: null });
const applyFilters = () => load();
let loadTimer: any = null;
function scheduleLoad() {
  if (loadTimer) clearTimeout(loadTimer);
  loadTimer = setTimeout(load, 300);
}
import { watch } from 'vue';
watch(() => filters.status, scheduleLoad);
watch(() => filters.range, scheduleLoad, { deep: true });
async function load() {
  const params: any = {};
  if (filters.status) params.status = filters.status;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  rows.value = await api.aiTasks(params);
}
const createVisible = ref(false);
const editing = ref<any | null>(null);
const methods = ref<string[]>([]);
const form = reactive<{
  name: string;
  items: string[];
  method: string;
  range: [Date, Date] | null;
  schools: string[];
}>({ name: '', items: [], method: '', range: null, schools: [] });
const openCreate = () => {
  editing.value = null;
  form.name = '';
  form.items = [];
  form.method = 'AI自动巡查';
  form.range = null as any;
  form.schools = [];
  createVisible.value = true;
};
const save = async () => {
  const period =
    form.range && form.range.length === 2
      ? { start: form.range[0].toISOString(), end: form.range[1].toISOString() }
      : undefined;
  if (editing.value) {
    const updated = await api.aiTaskUpdate(editing.value.id, {
      name: form.name,
      items: form.items,
      method: form.method,
      period,
      schools: form.schools,
    });
    const idx = rows.value.findIndex((r) => r.id === editing.value.id);
    if (idx !== -1) rows.value[idx] = updated;
  } else {
    const t = await api.aiTaskCreate({
      name: form.name,
      items: form.items,
      method: form.method,
      period,
      schools: form.schools,
    });
    rows.value.unshift(t);
  }
  createVisible.value = false;
};
const onExportCsv = () =>
  exportCsv('巡查任务', rows.value, {
    id: '任务ID',
    name: '任务名称',
    method: '巡查方式',
    items: '巡查事项',
    'period.start': '开始',
    'period.end': '结束',
    schools: '巡查学校',
    status: '状态',
    createdAt: '创建时间',
  });
onMounted(async () => {
  types.value = await (
    await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/school/ai/types`)
  ).json();
  methods.value = await api.aiMethods();
  schools.value = await api.aiSchools();
  await load();
});
function edit(row: any) {
  editing.value = row;
  form.name = row.name;
  form.items = [...(row.items || [])];
  form.method = row.method;
  form.range =
    row.period?.start && row.period?.end
      ? ([new Date(row.period.start), new Date(row.period.end)] as any)
      : null;
  form.schools = [...(row.schools || [])];
  createVisible.value = true;
}
async function setStatus(row: any, status: '待处理' | '进行中' | '已完成') {
  const updated = await api.aiTaskSetStatus(row.id, status);
  const idx = rows.value.findIndex((r) => r.id === row.id);
  if (idx !== -1) rows.value[idx] = updated;
}
</script>
