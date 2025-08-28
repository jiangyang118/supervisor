<template>
  <div style="padding: 8px">
    <!-- 顶部筛选与导出 -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <el-form :inline="true" label-width="auto" class="toolbar-form" @submit.prevent>
          <el-form-item label="日期">
            <el-date-picker
              v-model="range"
              type="daterange"
              unlink-panels
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              clearable
            />
          </el-form-item>
          <el-form-item label="学校">
            <el-select
              v-model="school"
              placeholder="全部学校"
              clearable
              filterable
              size="small"
              style="min-width: 220px"
            >
              <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="toolbar-actions">
          <el-button type="primary" size="small" @click="load">查询</el-button>
          <el-button size="small" @click="exportCsvReport">导出 CSV</el-button>
          <el-button size="small" @click="exportPdf">导出 PDF</el-button>
        </div>
      </div>
    </el-card>

    <!-- KPI 汇总 -->
    <el-row :gutter="12" style="margin-bottom: 12px">
      <el-col :span="4"
        ><el-card
          ><template #header>晨检</template>
          <div class="kpi">{{ kpi.morning }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>留样</template>
          <div class="kpi">{{ kpi.sampling }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>消毒</template>
          <div class="kpi">{{ kpi.disinfection }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>陪餐</template>
          <div class="kpi">{{ kpi.dine }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>废弃物</template>
          <div class="kpi">{{ kpi.waste }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>未上报合计</template>
          <div class="kpi">{{ missingTotal }}</div></el-card
        ></el-col
      >
    </el-row>

    <el-card>
      <template #header>学校上报情况</template>
      <el-table :data="rows" size="small" border>
        <el-table-column prop="school" label="学校" />
        <el-table-column prop="morning" label="晨检" width="100" />
        <el-table-column prop="sampling" label="留样" width="100" />
        <el-table-column prop="disinfection" label="消毒" width="100" />
        <el-table-column prop="dine" label="陪餐" width="100" />
        <el-table-column prop="waste" label="废弃物" width="100" />
        <el-table-column label="未上报项">
          <template #default="{ row }">
            <span v-if="row.morning === 0">晨检</span>
            <span v-if="row.sampling === 0">{{ row.morning === 0 ? '，' : '' }}留样</span>
            <span v-if="row.disinfection === 0"
              >{{ row.morning === 0 || row.sampling === 0 ? '，' : '' }}消毒</span
            >
            <span v-if="row.dine === 0"
              >{{
                row.morning === 0 || row.sampling === 0 || row.disinfection === 0 ? '，' : ''
              }}陪餐</span
            >
            <span v-if="row.waste === 0"
              >{{
                row.morning === 0 || row.sampling === 0 || row.disinfection === 0 || row.dine === 0
                  ? '，'
                  : ''
              }}废弃物</span
            >
            <span v-if="row.morning && row.sampling && row.disinfection && row.dine && row.waste"
              >—</span
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { exportCsv as doExportCsv } from '../utils/export';
import { api } from '../services/api';

const range = ref<[Date, Date] | null>(null);
const school = ref<string | null>(null);
const schools = ref<Array<{ id: string; name: string }>>([]);

const kpi = ref({ morning: 0, sampling: 0, disinfection: 0, dine: 0, waste: 0 });
const missing = ref({ morning: 0, sampling: 0, disinfection: 0, dine: 0, waste: 0 });
const rows = ref<any[]>([]);
const missingTotal = computed(
  () =>
    missing.value.morning +
    missing.value.sampling +
    missing.value.disinfection +
    missing.value.dine +
    missing.value.waste,
);

async function load() {
  try {
    if (!schools.value.length) schools.value = await api.schools();
  } catch {
    // ignore errors for demo data
  }
  const params: any = {};
  if (range.value && range.value.length === 2) {
    params.start = range.value[0].toISOString();
    params.end = range.value[1].toISOString();
  }
  if (school.value) params.schoolId = school.value;
  const data = await api.dailyReport(params);
  rows.value = data.rows;
  kpi.value = {
    morning: data.summary.totals.morning,
    sampling: data.summary.totals.sampling,
    disinfection: data.summary.totals.disinfection,
    dine: data.summary.totals.dine,
    waste: data.summary.totals.waste,
  } as any;
  missing.value = data.summary.missing;
}

function exportPdf() {
  alert('导出 PDF（演示）');
}
function exportCsvReport() {
  doExportCsv('每日-学校上报情况', rows.value, {
    school: '学校',
    morning: '晨检',
    sampling: '留样',
    disinfection: '消毒',
    dine: '陪餐',
    waste: '废弃物',
  });
}

onMounted(() => load());
</script>

<style scoped>
.toolbar-card {
  margin-bottom: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-form {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.kpi {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
</style>
