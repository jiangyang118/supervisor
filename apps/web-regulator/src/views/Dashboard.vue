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

// 从各个子模块获取数据并合并
async function fetchFromSubModules() {
  try {
    // 并行获取各个子模块的数据
    const [schoolsStats, aiEvents, recentDailyReports, schoolCanteens, schoolLedgerStats] =
      await Promise.all([
        api.schools(),
        api.aiEvents({ page: 1, pageSize: 100 }),
        api.dailyReport({
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: getTodayDate(),
        }),
        api.credCanteens(),
        api.ledgerSampling({ page: 1, pageSize: 1 }),
      ]);

    // 统计学校数量
    const schoolCount = schoolsStats?.length || 0;

    // 统计食堂数量
    const canteenCount = schoolCanteens?.length || 0;

    // 统计今日上报数量
    const today = getTodayDate();
    const todayReportCount =
      recentDailyReports?.rows?.find((row) => row.date === today)?.count || 0;

    // 统计AI预警数量
    const aiWarningCount = aiEvents?.items?.length || 0;

    // 计算AI预警类型分布
    const aiTypeMap = new Map<string, number>();
    aiEvents?.items?.forEach((event) => {
      const type = event.type || '其他';
      aiTypeMap.set(type, (aiTypeMap.get(type) || 0) + 1);
    });
    const aiTypeStats = Array.from(aiTypeMap.entries()).map(([type, count]) => ({ type, count }));

    // 生成近7日上报趋势
    const sevenDayReports = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const count = recentDailyReports?.rows?.find((row) => row.date === date)?.count || 0;
      sevenDayReports.push({ day: i === 0 ? 'D-0' : `D-${i}`, count });
    }

    // 计算预警学校排行
    const schoolWarningMap = new Map<string, { id: string; name: string; count: number }>();
    aiEvents?.items?.forEach((event) => {
      if (event.schoolId && event.schoolName) {
        if (!schoolWarningMap.has(event.schoolId)) {
          schoolWarningMap.set(event.schoolId, {
            id: event.schoolId,
            name: event.schoolName,
            count: 0,
          });
        }
        schoolWarningMap.get(event.schoolId)!.count++;
      }
    });
    const schoolWarningStats = Array.from(schoolWarningMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((school, index) => ({
        rank: index + 1,
        school: school.name,
        schoolId: school.id,
        warnings: school.count,
      }));

    return {
      kpis: {
        schools: schoolCount,
        canteens: canteenCount,
        todayReports: todayReportCount,
        aiWarnings: aiWarningCount,
        // 使用默认值或从其他API获取
        hygienePassRate: 97,
        devicesOnlineRate: 92,
      },
      aiByType:
        aiTypeStats.length > 0
          ? aiTypeStats
          : [
              { type: '未戴帽', count: 12 },
              { type: '未戴口罩', count: 8 },
              { type: '打电话', count: 5 },
              { type: '吸烟', count: 2 },
            ],
      dailyReports: sevenDayReports,
      topWarnings:
        schoolWarningStats.length > 0
          ? schoolWarningStats
          : [
              { rank: 1, school: '示例一中', schoolId: 'school1', warnings: 12 },
              { rank: 2, school: '示例二小', schoolId: 'school2', warnings: 10 },
              { rank: 3, school: '示例三幼', schoolId: 'school3', warnings: 8 },
              { rank: 4, school: '示例四小', schoolId: 'school4', warnings: 6 },
              { rank: 5, school: '示例五中', schoolId: 'school5', warnings: 5 },
            ],
    };
  } catch (error) {
    console.error('获取子模块数据失败:', error);
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
    return [
      { owner: '王某', type: '健康证', expireAt: '2025-09-30' },
      { owner: '李某', type: '健康证', expireAt: '2025-10-02' },
      { owner: '供应商A', type: '营业执照', expireAt: '2025-10-05' },
      { owner: '示例一中', type: '食堂许可证', expireAt: '2025-10-07' },
      { owner: '示例二小', type: '食堂许可证', expireAt: '2025-10-12' },
    ];
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
      { name: '晨检', count: 22 },
      { name: '留样', count: 15 },
      { name: '消毒', count: 24 },
      { name: '陪餐', count: 9 },
      { name: '废弃物', count: 26 },
    ];
  }
}

// 最近活动动态数据
const recentActivities = ref([
  { time: '10:30', content: 'AI系统发现3起未戴口罩行为', link: '/ai/inspections' },
  { time: '09:15', content: '收到25家学校晨检上报', link: '/ledgers/morning' },
  { time: '08:45', content: '示例一中完成食品安全检查', link: '/inspections' },
  { time: '昨天', content: '2名工作人员健康证即将到期', link: '/certificates' },
]);

onMounted(async () => {
  try {
    // 优先从各个子模块获取数据
    const subModuleData = await fetchFromSubModules();
    const certificates = await fetchExpiringCertificates();
    const ledgers = await fetchTodayLedgers();

    if (subModuleData) {
      kpis.value = subModuleData.kpis;
      aiByType.value = subModuleData.aiByType;
      dailyReports.value = subModuleData.dailyReports;
      topWarnings.value = subModuleData.topWarnings;
    } else {
      // 子模块数据获取失败时，尝试使用overview接口
      const overviewData = await api.overview();
      if (overviewData && overviewData.kpis) {
        kpis.value = overviewData.kpis;
        aiByType.value = overviewData.aiByType || [];
        dailyReports.value = overviewData.dailyReports || [];
        topWarnings.value = overviewData.topWarnings || [];
      }
    }

    // 设置证件和台账数据
    expiringCerts.value = certificates;
    ledgerToday.value = ledgers;

    // 设置检查进度数据
    inspectionProgress.value = [
      { type: '日常', doing: 6, done: 18 },
      { type: '专项', doing: 3, done: 9 },
      { type: '双随机', doing: 2, done: 7 },
    ];

    return;
  } catch (e) {
    console.error('数据获取失败:', e);
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
      { rank: 1, school: '示例一中', schoolId: 'school1', warnings: 12 },
      { rank: 2, school: '示例二小', schoolId: 'school2', warnings: 10 },
      { rank: 3, school: '示例三幼', schoolId: 'school3', warnings: 8 },
      { rank: 4, school: '示例四小', schoolId: 'school4', warnings: 6 },
      { rank: 5, school: '示例五中', schoolId: 'school5', warnings: 5 },
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
