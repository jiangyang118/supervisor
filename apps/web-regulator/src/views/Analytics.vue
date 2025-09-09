<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>数据看版</span>
        <div>
          <el-button @click="exportPdf">导出 PDF（占位）</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="6"
        ><el-card
          ><template #header>学校</template>
          <div class="kpi">{{ kpis.schools }}</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>AI 预警</template>
          <div class="kpi">{{ kpis.aiWarnings }}</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>今日上报</template>
          <div class="kpi">{{ kpis.todayReports }}</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>设备在线率</template>
          <div class="kpi">{{ kpis.devicesOnlineRate }}%</div></el-card
        ></el-col
      >
    </el-row>
    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>近7日上报趋势</template>
          <div style="height: 260px">
            <v-chart v-if="trendOption" :option="trendOption" />
            <el-skeleton v-else :rows="6" animated />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>预警类型分布</template>
          <div style="height: 260px">
            <v-chart v-if="aiOption" :option="aiOption" />
            <el-skeleton v-else :rows="6" animated />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
  
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { api } from '../services/api';
import { use } from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([BarChart, LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

const kpis = ref({ schools: 0, aiWarnings: 0, todayReports: 0, devicesOnlineRate: 0 });
const aiByType = ref<{ type: string; count: number }[]>([]);
const dailyReports = ref<{ day: string; count: number }[]>([]);

const aiOption = computed(() =>
  aiByType.value.length
    ? {
        grid: { left: 40, right: 20, top: 10, bottom: 30 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: aiByType.value.map((i) => i.type) },
        yAxis: { type: 'value' },
        series: [
          { type: 'bar', data: aiByType.value.map((i) => i.count), itemStyle: { color: '#E6A23C' }, barWidth: 24 },
        ],
      }
    : null,
);
const trendOption = computed(() =>
  dailyReports.value.length
    ? {
        grid: { left: 40, right: 20, top: 10, bottom: 30 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dailyReports.value.map((i) => i.day) },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: dailyReports.value.map((i) => i.count), smooth: true, itemStyle: { color: '#409EFF' } }],
      }
    : null,
);

async function load() {
  const data = await api.overview();
  if (data?.kpis) {
    kpis.value = data.kpis;
    aiByType.value = data.aiByType || [];
    dailyReports.value = data.dailyReports || [];
  }
}

const exportPdf = () => alert('导出 PDF（演示）');
onMounted(load);
</script>

<style scoped>
.kpi { font-size: 22px; font-weight: 700; color: #303133; }
</style>
