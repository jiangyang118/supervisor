<template>
  <div>
    <el-card>
     

      <!-- 顶部关键指标 -->
      <el-row :gutter="12">
        <el-col :span="4"><el-statistic title="AI 预警" :value="cards.aiAlerts" /></el-col>
        <el-col :span="4"><el-statistic title="晨检次数" :value="cards.morningChecks" /></el-col>
        <el-col :span="4"><el-statistic title="今日入库(笔)" :value="cards.inboundCount" /></el-col>
        <el-col :span="4"
          ><el-statistic title="入库重量(kg)" :value="cards.inboundWeightKg"
        /></el-col>
        <el-col :span="4"><el-statistic title="满意度(%)" :value="cards.satisfaction" /></el-col>
        <el-col :span="4"><el-statistic title="卫生上报" :value="cards.hygieneReports" /></el-col>
      </el-row>

      <el-row :gutter="12" style="margin-top: 12px">
        <!-- 入库方式占比 -->
        <el-col :span="8">
          <el-card
            ><template #header>入库方式</template>
            <v-chart class="chart" :option="inboundModeOption" autoresize />
          </el-card>
        </el-col>

        <!-- 出库用途占比 -->
        <el-col :span="8">
          <el-card
            ><template #header>出库用途</template>
            <v-chart class="chart" :option="outboundPurposeOption" autoresize />
          </el-card>
        </el-col>

        <!-- 工勤人员健康证 -->
        <el-col :span="8">
          <el-card
            ><template #header>工勤人员健康证状况</template>
            <v-chart class="chart" :option="staffHealthOption" autoresize />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="12" style="margin-top: 12px">
        <!-- 今日入库、今日出库清单 -->
        <el-col :span="12">
          <el-card>
            <template #header>今日入库食材</template>
            <el-table :data="inbound.items" size="small" border>
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="qty" label="数量" width="120" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>今日出库食材</template>
            <el-table :data="outbound.items" size="small" border>
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="qty" label="数量" width="120" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="12" style="margin-top: 12px">
        <!-- 今日菜品、预警信息 -->
        <el-col :span="12">
          <el-card>
            <template #header>今日菜品</template>
            <el-tag v-for="d in dishesToday" :key="d.name" style="margin: 4px">{{ d.name }}</el-tag>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>预警信息</template>
            <el-table :data="warnings" size="small" border>
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="level" label="等级" width="100" />
              <el-table-column prop="at" label="时间" width="200" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 实时监控（SSE占位） -->
      <el-card style="margin-top: 12px">
        <template #header>实时监控</template>
        <div>已接收事件：{{ sseCount }}，最近：{{ lastEvent }}</div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api, API_BASE } from '../services/api';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent, TitleComponent]);

const loading = ref(false);
import { getCurrentSchoolId } from '../utils/school';
const schoolId = ref<string | undefined>(getCurrentSchoolId());

// state from API
const cards = ref({
  aiAlerts: 0,
  morningChecks: 0,
  inboundCount: 0,
  inboundWeightKg: 0,
  satisfaction: 0,
  hygieneReports: 0,
});
const canteenStaff = ref({ total: 0, healthCertValid: 0, invalid: 0 });
const inbound = ref<{
  items: Array<{ name: string; qty: number }>;
  mode: Array<{ mode: string; value: number }>;
}>({ items: [], mode: [] });
const outbound = ref<{
  items: Array<{ name: string; qty: number }>;
  purpose: Array<{ purpose: string; value: number }>;
}>({ items: [], purpose: [] });
const dishesToday = ref<Array<{ name: string }>>([]);
const warnings = ref<Array<any>>([]);

// charts options
const inboundModeOption = ref<any>({});
const outboundPurposeOption = ref<any>({});
const staffHealthOption = ref<any>({});

const sseCount = ref(0);
const lastEvent = ref<string>('');

async function load() {
  loading.value = true;
  try {
    const data = await api.analyticsDashboard({ schoolId: schoolId.value });
    cards.value = data.cards;
    canteenStaff.value = data.canteenStaff;
    inbound.value = data.inbound;
    outbound.value = data.outbound;
    dishesToday.value = data.dishesToday;
    warnings.value = data.warnings;

    inboundModeOption.value = {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: data.inbound.mode.map((x: any) => ({ name: x.mode, value: x.value })),
        },
      ],
    };
    outboundPurposeOption.value = {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: data.outbound.purpose.map((x: any) => ({ name: x.purpose, value: x.value })),
        },
      ],
    };
    staffHealthOption.value = {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: [
            { name: '健康证有效', value: data.canteenStaff.healthCertValid },
            { name: '无效/缺失', value: data.canteenStaff.invalid },
          ],
        },
      ],
    };
  } finally {
    loading.value = false;
  }
}

function initSSE() {
  try {
    const es = new EventSource(`${API_BASE}/school/analytics/stream`);
    es.onmessage = (ev) => {
      sseCount.value++;
      lastEvent.value = new Date().toLocaleTimeString();
    };
    es.onerror = () => {
      /* ignore for demo */
    };
  } catch {}
}

onMounted(() => {
  load();
  initSSE();
  const h = () => { schoolId.value = getCurrentSchoolId(); load(); };
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
});
</script>

<style scoped>
.chart {
  height: 260px;
}
</style>
