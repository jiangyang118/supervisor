<template>
  <el-card class="insp-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>监督检查</span>
      </div>
    </template>
    <el-form :inline="true" class="insp-filters">
      <el-form-item label="类型">
        <el-select v-model="filters.type" clearable placeholder="全部" style="min-width: 140px">
          <el-option label="日常" value="日常" />
          <el-option label="专项" value="专项" />
          <el-option label="双随机" value="双随机" />
        </el-select>
      </el-form-item>
      <el-form-item label="学校">
        <el-select v-model="filters.schoolId" clearable placeholder="全部" style="min-width: 220px">
          <el-option v-for="s in schools" :key="s.id" :value="s.id" :label="s.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="检查人"
        ><el-input v-model="filters.assignee" placeholder="姓名关键词" style="width: 180px"
      /></el-form-item>
      <el-form-item label="日期"
        ><el-date-picker v-model="range" type="daterange" unlink-panels
      /></el-form-item>
      <el-form-item>
        <el-button @click="load">查询</el-button>
        <el-button @click="exportCsv">导出</el-button>
        <el-button type="primary" @click="openCreate">新增任务</el-button>
        <el-button type="success" @click="openRandom">双随机</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="id" label="任务ID" width="140" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="schoolName" label="学校" width="180" />
      <el-table-column prop="assignee" label="检查人" width="140" />
      <el-table-column prop="content" label="检查内容" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="200" />
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增检查任务" width="560px">
    <el-form :model="form" label-width="120px">
      <el-form-item label="类型"
        ><el-select v-model="form.type"
          ><el-option label="日常" value="日常" /><el-option label="专项" value="专项" /></el-select
      ></el-form-item>
      <el-form-item label="学校"
        ><el-select v-model="form.schoolId" style="width: 280px"
          ><el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" /></el-select
      ></el-form-item>
      <el-form-item label="检查人"
        ><el-select v-model="form.assignee" style="width: 280px" clearable filterable
          ><el-option
            v-for="u in inspectors"
            :key="u.id"
            :label="u.name"
            :value="u.name" /></el-select
      ></el-form-item>
      <el-form-item label="检查事项"
        ><el-select
          v-model="form.content"
          style="width: 280px"
          filterable
          allow-create
          default-first-option
          ><el-option v-for="it in config.items" :key="it" :label="it" :value="it" /></el-select
      ></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="randomVisible" title="双随机生成" width="560px">
    <el-form :model="randForm" label-width="140px">
      <el-form-item label="检查事项"
        ><el-select
          v-model="randForm.item"
          style="width: 280px"
          filterable
          allow-create
          default-first-option
          ><el-option v-for="it in config.items" :key="it" :label="it" :value="it" /></el-select
      ></el-form-item>
      <el-form-item label="抽取检查人数"
        ><el-input-number v-model="randForm.inspectorCount" :min="1" :max="20"
      /></el-form-item>
      <el-form-item label="抽取学校数量"
        ><el-input-number v-model="randForm.schoolCount" :min="1" :max="schools.length"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="randomVisible = false">取消</el-button>
      <el-button type="primary" @click="doRandom">生成</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { api } from '../services/api';

const schools = ref<Array<{ id: string; name: string }>>([]);
const inspectors = ref<Array<{ id: string; name: string }>>([]);
const config = ref<{ items: string[]; penalties: string[]; publications: string[] }>({
  items: [],
  penalties: [],
  publications: [],
});

const filters = ref<{
  type?: '日常' | '专项' | '双随机' | '';
  schoolId?: string;
  assignee?: string;
  start?: string;
  end?: string;
}>({});
const range = ref<[Date, Date] | null>(null);
const rows = ref<any[]>([]);

function withRange(p: any) {
  const q: any = { ...p };
  if (range.value) {
    if (range.value[0]) q.start = new Date(range.value[0]).toISOString();
    if (range.value[1]) q.end = new Date(range.value[1]).toISOString();
  }
  return q;
}
async function load() {
  const res = await api.inspTasks(withRange(filters.value));
  rows.value = res.items || [];
}
async function exportCsv() {
  const csv = await api.inspTasksExportCsv(withRange(filters.value));
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '监督检查任务.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const createVisible = ref(false);
const form = reactive<{
  type: '日常' | '专项';
  schoolId: '' | string;
  assignee?: string;
  content: string;
}>({ type: '日常', schoolId: '', assignee: '', content: '' });
function openCreate() {
  createVisible.value = true;
}
async function save() {
  if (!form.schoolId || !form.content) return;
  await api.inspTaskCreate({
    type: form.type,
    schoolId: form.schoolId!,
    assignee: form.assignee || undefined,
    content: form.content,
  });
  createVisible.value = false;
  await load();
}

const randomVisible = ref(false);
const randForm = reactive<{ item: string; inspectorCount: number; schoolCount: number }>({
  item: '',
  inspectorCount: 1,
  schoolCount: 1,
});
function openRandom() {
  randomVisible.value = true;
}
async function doRandom() {
  if (!randForm.item) return;
  await api.inspTaskRandom({
    item: randForm.item,
    inspectorCount: randForm.inspectorCount,
    schoolCount: randForm.schoolCount,
  });
  randomVisible.value = false;
  await load();
}

onMounted(async () => {
  const s = await api.schools();
  schools.value = s;
  inspectors.value = await api.inspInspectors();
  config.value = await api.inspConfig();
  await load();
});
</script>

<style>
.insp-filters {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
</style>
