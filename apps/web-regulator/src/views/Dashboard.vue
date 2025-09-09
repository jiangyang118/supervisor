<template>
  <div>
    <el-row :gutter="12">
      <el-col :span="4"
        ><el-card
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="go('/analytics?view=schools')"
          ><template #header>学校</template>
          <div class="kpi">{{ kpis.schools }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="go('/analytics?view=canteens')"
          ><template #header>食堂</template>
          <div class="kpi">{{ kpis.canteens }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card class="cursor-pointer hover:shadow-md transition-shadow" @click="go('/reports')"
          ><template #header>今日上报</template>
          <div class="kpi">{{ kpis.todayReports }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card class="cursor-pointer hover:shadow-md transition-shadow" @click="go('/warnings')"
          ><template #header>AI 预警</template>
          <div class="kpi">{{ kpis.aiWarnings }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="go('/inspections')"
          ><template #header>卫生合格率</template>
          <div class="kpi">{{ kpis.hygienePassRate }}%</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="go('/bright-kitchen')"
          ><template #header>设备在线率</template>
          <div class="kpi">{{ kpis.devicesOnlineRate }}%</div></el-card
        ></el-col
      >
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="go('/ai/inspections')"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span>AI预警类型分布</span>
              <el-button size="small" type="text" @click.stop="exportAIEvents">导出</el-button>
            </div>
          </template>
          <div style="height: 240px">
            <v-chart :option="aiOption" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="cursor-pointer hover:shadow-md transition-shadow" @click="go('/reports')">
          <template #header>
            <div class="flex justify-between items-center">
              <span>近7日上报趋势</span>
              <el-button size="small" type="text" @click.stop="exportDailyReports">导出</el-button>
            </div>
          </template>
          <div style="height: 240px">
            <v-chart :option="trendOption" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header>
            <div class="flex justify-between items-center">
              <span>预警学校排行</span>
              <el-button size="small" type="text" @click="exportTopWarnings">导出</el-button>
            </div>
          </template>
          <el-table
            :data="topWarnings"
            border
            class="cursor-pointer"
            style="width: 100%"
            @row-click="(row) => go(`/schools/${encodeURIComponent(row.schoolId)}/overview`)"
          >
            <el-table-column prop="rank" label="#" width="50" align="center" />
            <el-table-column prop="school" label="学校" align="center" />
            <el-table-column prop="warnings" label="预警数" width="100" align="center" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header>
            <div class="flex justify-between items-center">
              <span>即将到期证件</span>
              <el-button size="small" type="text" @click="go('/certificates')">查看全部</el-button>
            </div>
          </template>
          <el-table
            :data="expiringCerts"
            border
            class="cursor-pointer"
            style="width: 100%"
            @row-click="go('/certificates')"
          >
            <el-table-column prop="owner" label="证件所有人" align="center" />
            <el-table-column prop="type" label="证件类型" align="center" width="120" />
            <el-table-column prop="expireAt" label="到期日期" align="center" width="120">
              <template #default="scope">
                <span :class="getExpireClass(scope.row.expireAt)">{{ scope.row.expireAt }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header>
            <div class="flex justify-between items-center">
              <span>台账今日汇总</span>
              <el-button size="small" type="text" @click="go('/reports')">查看全部</el-button>
            </div>
          </template>
          <el-table
            :data="ledgerToday"
            border
            class="cursor-pointer"
            style="width: 100%"
            @row-click="(row) => go(getLedgerLink(row.name))"
          >
            <el-table-column prop="name" label="台账类型" align="center" />
            <el-table-column prop="count" label="上报数" align="center" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header>
            <div class="flex justify-between items-center">
              <span>监督检查进度</span>
              <el-button size="small" type="text" @click="go('/inspections')">查看全部</el-button>
            </div>
          </template>
          <el-table
            :data="inspectionProgress"
            border
            class="cursor-pointer"
            style="width: 100%"
            @row-click="go('/inspections')"
          >
            <el-table-column prop="type" label="检查类型" align="center" />
            <el-table-column prop="doing" label="进行中" align="center" />
            <el-table-column prop="done" label="已完成" align="center" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 12px">
      <el-col :span="24">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header><span>最近活动动态</span></template>
          <div class="timeline">
            <div v-for="(activity, index) in recentActivities" :key="index" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-time">{{ activity.time }}</div>
                <div
                  class="timeline-text cursor-pointer hover:text-blue-600"
                  @click="go(activity.link)"
                >
                  {{ activity.content }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
const topWarnings = ref<{ rank: number; school: string; schoolId: string; warnings: number }[]>([]);
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

function exportAIEvents() {
  exportCsv('AI预警类型分布', aiByType.value, { type: '预警类型', count: '数量' });
}

function exportDailyReports() {
  exportCsv('近7日上报趋势', dailyReports.value, { day: '日期', count: '上报数' });
}

// 获取台账对应的路由链接
function getLedgerLink(name: string) {
  const ledgerRoutes: Record<string, string> = {
    晨检: '/ledgers/morning',
    留样: '/ledgers/sampling',
    消毒: '/ledgers/disinfection',
    陪餐: '/ledgers/dine',
    废弃物: '/ledgers/waste',
    农残: '/ledgers/pesticide',
    出入库: '/ledgers/inventory',
  };
  return ledgerRoutes[name] || '/reports';
}

// 获取当前日期（YYYY-MM-DD格式）
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 获取证件过期状态的样式类
function getExpireClass(expireAt: string) {
  const today = new Date();
  const expireDate = new Date(expireAt);
  const diffTime = expireDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return 'text-red-600 font-bold';
  } else if (diffDays <= 30) {
    return 'text-orange-500';
  }
  return '';
}

// 后端汇总接口（DB 聚合）：/reg/overview
async function fetchOverview() {
  try {
    const data = await api.overview();
    return data;
  } catch (e) {
    console.error('获取概览数据失败:', e);
    return null;
  }
}

// 获取即将到期证件数据
async function fetchExpiringCertificates() {
  try {
    const [workerCerts, supplierCerts, canteenCerts] = await Promise.all([
      api.credWorkers(),
      api.credSuppliers(),
      api.credCanteens(),
    ]);

    // 处理各类证件数据
    const allCerts = [];

    // 处理健康证
    workerCerts?.forEach((worker) => {
      if (worker.healthCertExpire) {
        allCerts.push({
          owner: worker.name,
          type: '健康证',
          expireAt: worker.healthCertExpire,
        });
      }
    });

    // 处理营业执照
    supplierCerts?.forEach((supplier) => {
      if (supplier.businessLicenseExpire) {
        allCerts.push({
          owner: supplier.name,
          type: '营业执照',
          expireAt: supplier.businessLicenseExpire,
        });
      }
    });

    // 处理食堂许可证
    canteenCerts?.forEach((canteen) => {
      if (canteen.licenseExpire) {
        allCerts.push({
          owner: canteen.schoolName || canteen.name,
          type: '食堂许可证',
          expireAt: canteen.licenseExpire,
        });
      }
    });

    // 按过期日期排序并取前5个
    return allCerts
      .sort((a, b) => new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('获取证件数据失败:', error);
    return [];
  }
}

// 获取台账今日汇总数据
async function fetchTodayLedgers() {
  try {
    const today = getTodayDate();
    const [morningChecks, sampling, disinfection, dining, waste] = await Promise.all([
      api.dailyReport({ start: today, end: today, schoolId: '', type: '晨检' }),
      api.ledgerSampling({ start: today, end: today, page: 1, pageSize: 1 }),
      api.ledgerDisinfection({ start: today, end: today, page: 1, pageSize: 1 }),
      api.ledgerDine({ start: today, end: today, page: 1, pageSize: 1 }),
      api.ledgerWaste({ start: today, end: today, page: 1, pageSize: 1 }),
    ]);

    return [
      { name: '晨检', count: morningChecks?.summary?.total || 0 },
      { name: '留样', count: sampling?.total || 0 },
      { name: '消毒', count: disinfection?.total || 0 },
      { name: '陪餐', count: dining?.total || 0 },
      { name: '废弃物', count: waste?.total || 0 },
    ];
  } catch (error) {
    console.error('获取台账数据失败:', error);
    return [
      { name: '晨检', count: 0 },
      { name: '留样', count: 0 },
      { name: '消毒', count: 0 },
      { name: '陪餐', count: 0 },
      { name: '废弃物', count: 0 },
    ];
  }
}

// 最近活动动态数据
const recentActivities = ref<any[]>([]);

onMounted(async () => {
  const overviewData = await fetchOverview();
  if (overviewData && overviewData.kpis) {
    kpis.value = overviewData.kpis;
    aiByType.value = overviewData.aiByType || [];
    dailyReports.value = overviewData.dailyReports || [];
    topWarnings.value = overviewData.topWarnings || [];
    expiringCerts.value = overviewData.expiringCerts || [];
  }
  // 台账进度可后续从专用接口接入，这里先置空
  inspectionProgress.value = [];
  // 今日台账简要
  ledgerToday.value = await fetchTodayLedgers();
});
</script>

<style scoped>
.kpi {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.timeline {
  padding: 10px 0;
}

.timeline-item {
  display: flex;
  margin-bottom: 10px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  background-color: #409eff;
  border-radius: 50%;
  margin-right: 10px;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.timeline-text {
  font-size: 14px;
  color: #303133;
}
</style>
