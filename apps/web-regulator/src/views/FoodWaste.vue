<template>
  <el-card class="fw-page">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食品浪费监管</span>
      </div>
    </template>

    <el-form :inline="true" class="fw-filters">
      <el-form-item label="日期">
        <el-date-picker
          v-model="range"
          type="daterange"
          unlink-panels
          start-placeholder="开始"
          end-placeholder="结束"
        />
      </el-form-item>
      <el-form-item label="学校">
        <el-select v-model="filters.schoolId" placeholder="全部" clearable style="min-width: 220px">
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="类别">
        <el-select v-model="filters.source" placeholder="全部" clearable style="min-width: 200px">
          <el-option label="库存损耗" value="库存损耗" />
          <el-option label="加工制作损耗" value="加工制作损耗" />
          <el-option label="剩菜剩饭损耗" value="剩菜剩饭损耗" />
        </el-select>
      </el-form-item>
      <el-form-item label="排行口径">
        <el-radio-group v-model="metric" size="small">
          <el-radio-button label="weight">按数量(kg)</el-radio-button>
          <el-radio-button label="amount">按金额(¥)</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button @click="reload">查询</el-button>
        <el-button @click="exportRanking">导出排行</el-button>
        <el-button @click="exportDetails">导出明细</el-button>
      </el-form-item>
    </el-form>

    <div class="fw-container">
      <div class="fw-left">
        <el-card class="fw-card">
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between">
              <span>学校排行</span>
            </div>
          </template>
          <el-table :data="ranking" size="small" border class="fw-scroll-table">
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="weightKg" label="数量(kg)" width="140" />
            <el-table-column prop="amountYuan" label="金额(¥)" width="140" />
          </el-table>
        </el-card>
        <el-card class="fw-card">
          <template #header>来源汇总</template>
          <el-table :data="sumBySource" size="small" border class="fw-scroll-table">
            <el-table-column prop="source" label="类别" />
            <el-table-column prop="weightKg" label="数量(kg)" width="140" />
            <el-table-column prop="amountYuan" label="金额(¥)" width="140" />
          </el-table>
        </el-card>
        <el-card class="fw-card">
          <template #header>原因 Top</template>
          <el-table :data="topReasons" size="small" border class="fw-scroll-table">
            <el-table-column prop="reason" label="原因" />
            <el-table-column prop="weightKg" label="数量(kg)" width="140" />
            <el-table-column prop="amountYuan" label="金额(¥)" width="140" />
          </el-table>
        </el-card>
      </div>
      <div class="fw-right">
        <el-card class="fw-details">
          <template #header>明细</template>
          <el-table :data="details" size="small" border class="fw-scroll-table">
            <el-table-column prop="date" label="日期" width="160" />
            <el-table-column prop="school" label="学校" width="160" />
            <el-table-column prop="source" label="类别" width="140" />
            <el-table-column prop="itemType" label="类型" width="100" />
            <el-table-column prop="itemName" label="名称" />
            <el-table-column prop="weightKg" label="数量(kg)" width="120" />
            <el-table-column prop="amountYuan" label="金额(¥)" width="120" />
            <el-table-column prop="reason" label="原因" />
          </el-table>
        </el-card>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { api } from '../services/api';

const schools = ref<Array<{ id: string; name: string }>>([]);
const filters = ref<{ schoolId?: string; source?: '库存损耗' | '加工制作损耗' | '剩菜剩饭损耗' }>({
  schoolId: undefined,
  source: undefined,
});
const range = ref<[Date, Date] | null>(null);
const metric = ref<'weight' | 'amount'>('weight');
const ranking = ref<any[]>([]);
const details = ref<any[]>([]);
const sumBySource = ref<any[]>([]);
const topReasons = ref<any[]>([]);

async function loadSchools() {
  const stats = await api.schools();
  schools.value = (stats || []).map((s: any) => ({ id: s.id, name: s.name }));
}
function fmtDate(d?: Date) {
  return d ? new Date(d).toISOString() : undefined;
}
function paramsWithRange(p: any) {
  const q: any = { ...p };
  if (range.value && range.value[0]) q.start = new Date(range.value[0]).toISOString();
  if (range.value && range.value[1]) q.end = new Date(range.value[1]).toISOString();
  return q;
}
async function loadRanking() {
  const arr = await api.foodWasteRanking(paramsWithRange({ metric: metric.value }));
  ranking.value = arr;
}
async function loadDetails() {
  const { items } = await api.foodWasteDetails(
    paramsWithRange({ schoolId: filters.value.schoolId, source: filters.value.source }),
  );
  details.value = items;
}
async function loadSummary() {
  const s = await api.foodWasteSummary(paramsWithRange({ schoolId: filters.value.schoolId }));
  sumBySource.value = s.bySource || [];
  const byReason = s.byReason || [];
  topReasons.value = [...byReason]
    .sort((a: any, b: any) =>
      metric.value === 'amount' ? b.amountYuan - a.amountYuan : b.weightKg - a.weightKg,
    )
    .slice(0, 10);
}
async function exportDetails() {
  const csv = await api.foodWasteExportCsv(
    paramsWithRange({ schoolId: filters.value.schoolId, source: filters.value.source }),
  );
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '食品浪费明细.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function exportRanking() {
  const csv = await api.foodWasteRankingExportCsv(paramsWithRange({ metric: metric.value }));
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '食品浪费学校排行.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function reload() {
  await Promise.all([loadRanking(), loadDetails(), loadSummary()]);
}
watch(metric, () => {
  loadRanking();
  loadSummary();
});
onMounted(async () => {
  await loadSchools();
  await reload();
});
</script>

<style>
.fw-page {
  min-height: 420px;
}
.fw-filters {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
.fw-container {
  display: flex;
  gap: 12px;
  height: calc(100vh - 260px);
}
.fw-left {
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fw-right {
  flex: 1 1 auto;
  min-width: 0;
}
.fw-card {
  height: 240px;
  display: flex;
  flex-direction: column;
}
.fw-details {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.fw-scroll-table {
}
/* ensure card body scrolls if content overflows */
.fw-card .el-card__body,
.fw-details .el-card__body {
  overflow: auto;
  flex: 1 1 auto;
}
</style>
