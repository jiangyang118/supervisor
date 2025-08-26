<template>
  <div style="padding: 8px">
    <!-- 顶部筛选与导出 -->
    <el-card shadow="never" style="margin-bottom: 12px">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
        <el-date-picker
          v-model="range"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
        <el-select
          v-model="school"
          placeholder="全部学校"
          clearable
          filterable
          style="min-width: 220px"
        >
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="exportCsvReport">导出 CSV</el-button>
        <el-button @click="exportPdf">导出 PDF</el-button>
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
          ><template #header>AI 预警</template>
          <div class="kpi">{{ kpi.ai }}</div></el-card
        ></el-col
      >
    </el-row>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>各类上报占比</template>
          <VChart :option="pieOption" autoresize style="height: 300px; width: 100%" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>AI 预警类型</template>
          <VChart :option="barOption" autoresize style="height: 300px; width: 100%" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>上报明细（TOP 学校）</template>
          <el-table :data="topReporters" size="small" border>
            <el-table-column prop="rank" label="#" width="60" />
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="count" label="上报数" width="120" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>预警明细（TOP 学校）</template>
          <el-table :data="topWarnings" size="small" border>
            <el-table-column prop="rank" label="#" width="60" />
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="warnings" label="预警数" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { exportCsv as doExportCsv } from '../utils/export';

use([PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const range = ref<[Date, Date] | null>(null);
const school = ref<string | null>(null);
const schools = ref<Array<{ id: string; name: string }>>([
  { id: 'sch-001', name: '示例一中' },
  { id: 'sch-002', name: '示例二小' },
  { id: 'sch-003', name: '示例三幼' },
]);

const kpi = ref({ morning: 220, sampling: 150, disinfection: 240, dine: 90, waste: 260, ai: 45 });
const aiType = ref([
  { type: '未戴帽', count: 20 },
  { type: '未戴口罩', count: 14 },
  { type: '打电话', count: 7 },
  { type: '吸烟', count: 4 },
]);
const topReporters = ref([
  { rank: 1, school: '示例一中', count: 320 },
  { rank: 2, school: '示例二小', count: 280 },
  { rank: 3, school: '示例三幼', count: 250 },
]);
const topWarnings = ref([
  { rank: 1, school: '示例一中', warnings: 12 },
  { rank: 2, school: '示例二小', warnings: 10 },
  { rank: 3, school: '示例三幼', warnings: 8 },
]);

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['35%', '70%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 1 },
      data: [
        { name: '晨检', value: kpi.value.morning },
        { name: '留样', value: kpi.value.sampling },
        { name: '消毒', value: kpi.value.disinfection },
        { name: '陪餐', value: kpi.value.dine },
        { name: '废弃物', value: kpi.value.waste },
        { name: 'AI 预警', value: kpi.value.ai },
      ],
    },
  ],
}));

const barOption = computed(() => ({
  grid: { left: 40, right: 20, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: aiType.value.map((i) => i.type) },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: aiType.value.map((i) => i.count), barWidth: 24 }],
}));

function load() {
  // 可对接真实接口；当前使用演示数据
}
function exportPdf() {
  alert('导出 PDF（演示）');
}
function exportCsvReport() {
  const flat = [
    { name: '晨检', count: kpi.value.morning },
    { name: '留样', count: kpi.value.sampling },
    { name: '消毒', count: kpi.value.disinfection },
    { name: '陪餐', count: kpi.value.dine },
    { name: '废弃物', count: kpi.value.waste },
    { name: 'AI 预警', count: kpi.value.ai },
  ];
  doExportCsv('每日报表汇总', flat, { name: '类别', count: '数量' });
}

onMounted(() => load());
</script>

<style scoped>
.kpi {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
</style>
