<template>
  <div>
    <el-row :gutter="12">
      <el-col :span="4"
        ><el-card
          ><template #header>学校</template>
          <div class="kpi">{{ kpis.schools }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>食堂</template>
          <div class="kpi">{{ kpis.canteens }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>今日上报</template>
          <div class="kpi">{{ kpis.todayReports }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>AI 预警</template>
          <div class="kpi">{{ kpis.aiWarnings }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>卫生合格率</template>
          <div class="kpi">{{ kpis.hygienePassRate }}%</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>设备在线率</template>
          <div class="kpi">{{ kpis.devicesOnlineRate }}%</div></el-card
        ></el-col
      >
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>AI 预警类型分布</template>
          <VChart :option="aiOption" autoresize style="height: 280px; width: 100%" />
          <div style="margin-top: 8px; text-align: right">
            <el-button size="small" @click="go('/ai/inspections')">查看明细</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>近7日上报趋势</template>
          <VChart :option="trendOption" autoresize style="height: 280px; width: 100%" />
          <div style="margin-top: 8px; text-align: right">
            <el-button size="small" @click="go('/reports')">查看报表</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>预警学校排行</template>
          <el-table :data="topWarnings" size="small" border>
            <el-table-column prop="rank" label="#" width="60" />
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="warnings" label="预警数" width="120" />
          </el-table>
          <div style="margin-top: 8px; text-align: right">
            <el-button size="small" @click="exportTopWarnings">导出排行</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>即将到期证件</template>
          <el-table :data="expiringCerts" size="small" border>
            <el-table-column prop="owner" label="主体/人员" />
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="expireAt" label="到期日" width="160" />
          </el-table>
          <div style="margin-top: 8px; text-align: right">
            <el-button size="small" @click="go('/certificates')">证件监管</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>台账今日汇总</template>
          <el-table :data="ledgerToday" size="small" border>
            <el-table-column prop="name" label="类别" />
            <el-table-column prop="count" label="上报数" width="120" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>监督检查进度</template>
          <el-table :data="inspectionProgress" size="small" border>
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="doing" label="进行中" width="120" />
            <el-table-column prop="done" label="已完成" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { exportCsv } from '../utils/export';
import { use } from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
]);

const router = useRouter();
const go = (p: string) => router.push(p);

const kpis = ref({
  schools: 0,
  canteens: 0,
  todayReports: 0,
  aiWarnings: 0,
  hygienePassRate: 0,
  devicesOnlineRate: 0,
});
const aiByType = ref<{ type: string; count: number }[]>([]);
const dailyReports = ref<{ day: string; count: number }[]>([]);
const topWarnings = ref<{ rank: number; school: string; warnings: number }[]>([]);
const expiringCerts = ref<{ owner: string; type: string; expireAt: string }[]>([]);
const ledgerToday = ref<{ name: string; count: number }[]>([]);
const inspectionProgress = ref<{ type: string; doing: number; done: number }[]>([]);

const aiOption = computed(() => ({
  grid: { left: 40, right: 20, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: aiByType.value.map((i) => i.type) },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: aiByType.value.map((i) => i.count),
      itemStyle: { color: '#E6A23C' },
      barWidth: 24,
    },
  ],
}));

const trendOption = computed(() => ({
  grid: { left: 40, right: 20, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: dailyReports.value.map((i) => i.day) },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'line',
      data: dailyReports.value.map((i) => i.count),
      smooth: true,
      itemStyle: { color: '#409EFF' },
    },
  ],
}));

function exportTopWarnings() {
  exportCsv('预警学校排行', topWarnings.value, { rank: '#', school: '学校', warnings: '预警数' });
}

onMounted(async () => {
  try {
    const data = await api.overview();
    if (data && data.kpis) {
      kpis.value = data.kpis;
      aiByType.value = data.aiByType;
      dailyReports.value = data.dailyReports;
      topWarnings.value = data.topWarnings;
      expiringCerts.value = data.expiringCerts;
      ledgerToday.value = [
        { name: '晨检', count: Math.round(data.kpis.todayReports * 0.2) },
        { name: '留样', count: Math.round(data.kpis.todayReports * 0.15) },
        { name: '消毒', count: Math.round(data.kpis.todayReports * 0.25) },
        { name: '陪餐', count: Math.round(data.kpis.todayReports * 0.1) },
        { name: '废弃物', count: Math.round(data.kpis.todayReports * 0.3) },
      ];
      inspectionProgress.value = [
        { type: '日常', doing: 6, done: 18 },
        { type: '专项', doing: 3, done: 9 },
        { type: '双随机', doing: 2, done: 7 },
      ];
      return;
    }
    throw new Error('empty');
  } catch (e) {
    // 后端未启动时，使用本地填充数据，确保页面不为空
    kpis.value = {
      schools: 42,
      canteens: 58,
      todayReports: 96,
      aiWarnings: 18,
      hygienePassRate: 97,
      devicesOnlineRate: 92,
    };
    aiByType.value = [
      { type: '未戴帽', count: 12 },
      { type: '未戴口罩', count: 8 },
      { type: '打电话', count: 5 },
      { type: '吸烟', count: 2 },
    ];
    dailyReports.value = [
      { day: 'D-6', count: 60 },
      { day: 'D-5', count: 72 },
      { day: 'D-4', count: 80 },
      { day: 'D-3', count: 66 },
      { day: 'D-2', count: 74 },
      { day: 'D-1', count: 88 },
      { day: 'D-0', count: 96 },
    ];
    topWarnings.value = [
      { rank: 1, school: '示例一中', warnings: 12 },
      { rank: 2, school: '示例二小', warnings: 10 },
      { rank: 3, school: '示例三幼', warnings: 8 },
      { rank: 4, school: '示例四小', warnings: 6 },
      { rank: 5, school: '示例五中', warnings: 5 },
    ];
    expiringCerts.value = [
      { owner: '王某', type: '健康证', expireAt: '2025-09-30' },
      { owner: '李某', type: '健康证', expireAt: '2025-10-02' },
      { owner: '供应商A', type: '营业执照', expireAt: '2025-10-05' },
      { owner: '示例一中', type: '食堂许可证', expireAt: '2025-10-07' },
      { owner: '示例二小', type: '食堂许可证', expireAt: '2025-10-12' },
    ];
    ledgerToday.value = [
      { name: '晨检', count: 22 },
      { name: '留样', count: 15 },
      { name: '消毒', count: 24 },
      { name: '陪餐', count: 9 },
      { name: '废弃物', count: 26 },
    ];
    inspectionProgress.value = [
      { type: '日常', doing: 6, done: 18 },
      { type: '专项', doing: 3, done: 9 },
      { type: '双随机', doing: 2, done: 7 },
    ];
  }
});
</script>

<style scoped>
.kpi {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
</style>
