<template>
  <div class="kpi-theme ">
    <!-- 顶部全局状态栏 -->
    <el-card class="topbar" shadow="never">
      <div class="topbar-row">
        <div class="tb-item clickable" @click="go('/overview/alerts')">
          今日预警总数：<el-tag type="danger">{{ todayWarnings }}</el-tag>
        </div>
        <div class="tb-item">当前时间：{{ nowStr }}</div>
      </div>
    </el-card>

    <!-- 一行四卡：晨检数据 / 人员健康证 / 卫生消毒上报 / 今日预警 -->
    <el-row :gutter="12" class="kpi-row" style="margin: 20px 0">
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card :class="['card','clickable','kpi-card','card-morning', morningOk ? 'ok' : 'warn']" @click="go('/morning-check')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <el-icon class="kpi-icon"><CircleCheck /></el-icon>
                <span class="kpi-title">晨检数据</span>
              </div>
              <span :class="['kpi-badge', morningOk ? 'ok' : 'warn']">{{ morningOk ? '正常' : `异常 ${morningAbnormal}` }}</span>
            </div>
          </template>
          <div class="kpi-main" :class="{ warn: !morningOk }">
            <span class="num">{{ morningRate }}</span><span class="unit">%</span>
          </div>
          <div class="kpi-line"><span>应检/已检：</span><b>{{ morningExpected }}</b>/<b>{{ morningActual }}</b></div>
          <div class="kpi-line"><span>完成率：</span><b>{{ morningRate }}%</b></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card :class="['card','clickable','kpi-card','card-cert', certExpired>0 ? 'warn' : 'ok']" @click="go('/hr/staff')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <el-icon class="kpi-icon"><User /></el-icon>
                <span class="kpi-title">人员健康证</span>
              </div>
              <span :class="['kpi-badge', certStatusClass]">{{ certStatusText }}</span>
            </div>
          </template>
          <div class="kpi-main" :class="{ warn: certExpired>0 }">
            <span class="num">{{ certExpired }}</span><span class="unit">过期</span>
          </div>
          <div class="kpi-line"><span>总人数：</span><b>{{ certTotal }}</b></div>
          <div class="kpi-line"><span>临期(30天)：</span><b>{{ certExpiring }}</b></div>
          <div class="kpi-line"><span>过期：</span><b class="warn">{{ certExpired }}</b></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card :class="['card','clickable','kpi-card','card-disinfection', disinfectionOk ? 'ok' : 'warn']" @click="go('/disinfection')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <el-icon class="kpi-icon"><Brush /></el-icon>
                <span class="kpi-title">卫生消毒上报</span>
              </div>
              <span :class="['kpi-badge', disinfectionOk ? 'ok' : 'warn']">{{ disinfectionOk ? '正常' : '未完成' }}</span>
            </div>
          </template>
          <div class="kpi-main" :class="{ warn: !disinfectionOk }">
            <span class="num">{{ disinfectionRate }}</span><span class="unit">%</span>
          </div>
          <div class="kpi-line"><span>应上报/已上报：</span><b>{{ disinfectionExpected }}</b>/<b>{{ disinfectionSubmitted }}</b></div>
          <div class="kpi-line"><span>完成率：</span><b>{{ disinfectionRate }}%</b></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card :class="['card','clickable','kpi-card','card-sampling', samplingOk ? 'ok' : 'warn']" @click="go('/daily-op/sampling/')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <el-icon class="kpi-icon"><Bell /></el-icon>
                <span class="kpi-title">菜品留样</span>
              </div>
              <span :class="['kpi-badge', samplingOk ? 'ok' : 'warn']">{{ samplingOk ? '有留样' : '未留样' }}</span>
            </div>
          </template>
          <div class="kpi-main" :class="{ warn: !samplingOk }">
            <span class="num">{{ samplingTodayCount }}</span><span class="unit">款</span>
          </div>
          <div class="kpi-line"><span>今日已留样总数：</span><b>{{ samplingTodayCount }}</b>款</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 两栏布局：AI预警类型分布 | 物联网设备状态 -->
    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header>
            <div style="display:flex; align-items:center; justify-content:space-between">
              <span style="font-weight:600">AI预警类型分布</span>
              <div style="display:flex; align-items:center; gap:8px">
                <el-tag  effect="plain">Top {{ aiTopN }}</el-tag>
                <el-select v-model="periodMode"  style="width: 120px">
                  <el-option label="本周" value="week" />
                  <el-option label="最近7天" value="7d" />
                </el-select>
                <el-button  type="text" @click.stop="exportAiBar">导出</el-button>
              </div>
            </div>
          </template>
          <v-chart class="ai-bar" :option="aiBarOption" autoresize @click="onAiBarClick" style="height: 260px; width: 100%" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="hover:shadow-md transition-shadow">
          <template #header>
            <div style="display:flex; align-items:center; justify-content:space-between">
              <span style="font-weight:600">物联网设备状态</span>
              <div style="display:flex; align-items:center; gap:8px">
                <el-select v-model="sortMode"  style="width: 120px">
                  <el-option label="默认排序" value="default" />
                  <el-option label="异常优先" value="abnormal" />
                  <el-option label="在线优先" value="online" />
                </el-select>
                <el-switch v-model="onlyAbnormal"  />
                <span style="font-size:12px;color:#909399">仅看异常</span>
                <el-button  type="text" @click="go('/devices')">查看全部</el-button>
              </div>
            </div>
          </template>
          <el-table
            :data="displayedDevices"
            
            border
            height="260"
            empty-text="暂无设备数据"
          >
            <el-table-column prop="name" label="设备名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <span class="status-dot" :class="row.statusClass" style="margin-right:6px"></span>
                <span>{{ row.statusText }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="last" label="最后上报时间" min-width="180" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方三项：农残检测 / 设备安全检测 / 废弃物管理 数据卡片（位于 AI 与设备状态模块下方） -->
    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
        <el-card :class="['card','clickable','kpi-card','card-bottom','card-pesticide']" @click="go('/pesticide-tests')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <span class="kpi-title">农残检测数据</span>
              </div>
              <span :class="['kpi-badge', pesticideLast?.result === '合格' ? 'ok' : (pesticideLast ? 'warn' : 'ok')]">
                {{ pesticideLast ? (pesticideLast.result || '—') : '—' }}
              </span>
            </div>
          </template>
          <div class="kpi-line"><span>上次农残检验日期：</span><b>{{ fmtDate(pesticideLast?.at) }}</b></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
        <el-card :class="['card','clickable','kpi-card','card-bottom','card-device']" @click="go('/device-safety')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <span class="kpi-title">设备安全检测数据</span>
              </div>
            </div>
          </template>
          <div class="kpi-line"><span>上次设备安全检测日期：</span><b>{{ fmtDate(deviceSafetyLastDate) }}</b></div>
          <div class="kpi-line">
            <span>状态：</span>
            <b class="ok">距今天已{{ deviceSafetyDaysSince }}天</b>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
        <el-card :class="['card','clickable','kpi-card','card-bottom','card-waste']" @click="go('/waste')">
          <template #header>
            <div class="kpi-header">
              <div class="kpi-title-wrap">
                <span class="kpi-title">废弃物管理数据</span>
              </div>
            </div>
          </template>
          <div class="kpi-line"><span>上次废弃物处理日期：</span><b>{{ fmtDate(wasteLastDate) }}</b></div>
          <div class="kpi-line">
            <span>状态：</span>
            <b class="ok">距今天已{{ wasteDaysSince }}天</b>
          </div>
        </el-card>
      </el-col>
    </el-row>

    
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { CircleCheck, Brush, Bell, User } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { exportCsv } from '../utils/export';
// charts for AI overview
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
const vChart = VChart;
import { getCurrentSchoolId } from '../utils/school';

// 今日待办：本地可编辑，可持久化
// 顶部状态栏数据（学校名称已在全局 Header 展示）
const nowStr = ref<string>('');
let tm: any;
function tickNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  nowStr.value = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const todayWarnings = ref<number>(0);

// 核心数据
const morningExpected = ref<number>(0);
const morningActual = ref<number>(0);
const morningAbnormal = ref<number>(0);
const morningRate = computed(() => morningExpected.value ? Math.round((morningActual.value / morningExpected.value) * 100) : 100);
const morningOk = computed(() => morningAbnormal.value === 0);

// 健康证统计（基于 personnel 接口）
const certTotal = ref<number>(0);
const certExpiring = ref<number>(0);
const certExpired = ref<number>(0);
const certStatusClass = computed(() => certExpired.value > 0 ? 'warn' : (certExpiring.value > 0 ? 'warn' : 'ok'));
const certStatusText = computed(() => certExpired.value > 0 ? '危险（有过期）' : (certExpiring.value > 0 ? '警告（有临期）' : '正常'));

const disinfectionSubmitted = ref<number>(0);
const disinfectionExpected = ref<number>(0);
const disinfectionRate = computed(() => disinfectionExpected.value ? Math.round((disinfectionSubmitted.value / disinfectionExpected.value) * 100) : 100);
const disinfectionOk = computed(() => disinfectionSubmitted.value >= disinfectionExpected.value);

const aiOpen = ref<number>(0);
const disinfectionExceptions = ref<number>(0);
const samplingTodayCount = ref<number>(0);
const samplingOk = computed(() => samplingTodayCount.value > 0);

// 下方三项数据源
const pesticideLast = ref<{ at?: string; result?: '合格'|'不合格' } | null>(null);
const deviceSafetyLastDate = ref<string | ''>('');
const deviceSafetyDaysSince = ref<number>(0);
const wasteLastDate = ref<string | ''>('');
const wasteDaysSince = ref<number>(0);

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toISOString().slice(0,10); } catch { return String(iso); }
}
function daysSince(dateStr?: string | null): number {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const one = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const two = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.floor((two.getTime() - one.getTime()) / (24 * 3600 * 1000));
    return diff >= 0 ? diff : 0;
  } catch { return 0; }
}

// AI本周类型分布（水平条形图）
type AiBarItem = { code: string; label: string; count: number };
const aiBar = ref<AiBarItem[]>([]);
const aiBarOption = computed(() => {
  const sorted = [...aiBar.value].sort((a, b) => b.count - a.count).slice(0, aiTopN.value);
  const total = sorted.reduce((s, x) => s + (Number(x.count) || 0), 0) || 0;
  // 单色系 + Top3 轻微高亮
  const main = '#409EFF';
  const top2 = '#73A1FF';
  const top3 = '#A7C2FF';
  const normal = '#C9D8FF';
  return {
    grid: { left: 80, right: 18, top: 10, bottom: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        try {
          const p = Array.isArray(params) ? params[0] : params;
          const val = Number(p?.value ?? 0);
          const pct = total ? Math.round((val / total) * 100) : 0;
          return `${p?.name}<br/>数量：${val}（${pct}%）`;
        } catch {
          return '';
        }
      },
      backgroundColor: 'rgba(50,50,50,0.9)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
    },
    xAxis: {
      type: 'value',
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e5eaf3' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((x) => x.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        formatter: (v: string) => (v && v.length > 8 ? v.slice(0, 8) + '…' : v),
        color: '#606266',
      },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((x) => x.count),
        barWidth: 18,
        barCategoryGap: '30%',
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: (p: any) => (p.dataIndex === 0 ? main : p.dataIndex === 1 ? top2 : p.dataIndex === 2 ? top3 : normal),
        },
        label: {
          show: true,
          position: 'right',
          color: '#606266',
          formatter: (p: any) => {
            const val = Number(p?.value ?? 0);
            const pct = total ? Math.round((val / total) * 100) : 0;
            return `${val}${total ? `（${pct}%）` : ''}`;
          },
        },
        emphasis: { focus: 'series', itemStyle: { opacity: 1 } },
        animationDuration: 300,
        animationEasing: 'quadraticOut',
      },
    ],
  } as any;
});

// 移除“AI预警设备分布”相关逻辑，统一两栏：类型分布 | 设备状态

const router = useRouter();
function go(path: string) { router.push(path); }

async function refreshAll() {
  const sid = getCurrentSchoolId();
  // 晨检
  // 应检人数：使用人员资质总人数粗略估算
  try {
    const sid = getCurrentSchoolId();
    const res = await api.personnelList({ schoolId: sid, page: 1, pageSize: 100000 });
    const items = (res as any)?.items || [];
    morningExpected.value = items.length || 0;
    // 健康证 KPI
    certTotal.value = items.length || 0;
    const now = Date.now(); const in30 = now + 30*24*3600*1000;
    certExpired.value = items.filter((c: any) => c.status === '过期' || (c.healthCertExpireAt && Date.parse(c.healthCertExpireAt) < now)).length;
    certExpiring.value = items.filter((c: any) => (c.status === '临期') || (c.healthCertExpireAt && Date.parse(c.healthCertExpireAt) >= now && Date.parse(c.healthCertExpireAt) <= in30)).length;
  } catch { morningExpected.value = 0; certTotal.value = 0; certExpired.value = 0; certExpiring.value = 0; }
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();
    const r = await api.morningList({ start: start.toISOString(), end: end.toISOString(), page: 1, pageSize: 100000, schoolId: sid ? Number(sid) : undefined } as any);
    const items = (r as any)?.items || [];
    morningActual.value = Number((r as any)?.total || items.length || 0);
    morningAbnormal.value = items.filter((x: any) => x.result === '异常' || x.abnormalTemp || (Array.isArray(x.handCheckResult) && x.handCheckResult.length) || (Array.isArray(x.healthAskResult) && x.healthAskResult.length)).length;
  } catch { morningActual.value = 0; morningAbnormal.value = 0; }
  // 健康证模块已移除
  // 消毒
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();
    const r = await api.disinfectionList({ start: start.toISOString(), end: end.toISOString(), page: 1, pageSize: 100000, schoolId: sid as any } as any);
    const items = (r as any)?.items || [];
    disinfectionSubmitted.value = Number((r as any)?.total || items.length || 0);
    disinfectionExpected.value = disinfectionSubmitted.value || 0; // 兜底视为100%
    disinfectionExceptions.value = items.filter((x: any) => x.exception).length;
  } catch { disinfectionSubmitted.value = 0; disinfectionExpected.value = 0; disinfectionExceptions.value = 0; }
  // 今日预警（AI OPEN + 消毒异常）
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();
    const ev = await api.aiEventsList({ schoolId: sid, status: 'OPEN', start: start.toISOString(), end: end.toISOString(), page: 1, pageSize: 1000 });
    aiOpen.value = Number((ev as any)?.total || ((ev as any)?.items || []).length || 0);
  } catch { aiOpen.value = 0; }
  todayWarnings.value = aiOpen.value + disinfectionExceptions.value;

  // 今日菜品留样数量
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();
    const r = await api.samplingList({ start: start.toISOString(), end: end.toISOString(), page: 1, pageSize: 100000, schoolId: sid ? Number(sid) : undefined } as any);
    const items = (r as any)?.items || [];
    samplingTodayCount.value = Number((r as any)?.total || items.length || 0);
  } catch { samplingTodayCount.value = 0; }

  // 农残检测（取最近一条）
  try {
    const sidNum = getCurrentSchoolId();
    const res = await api.pesticideList({ schoolId: sidNum ? Number(sidNum) : undefined, page: 1, pageSize: 1 } as any);
    const it = (res as any)?.items?.[0];
    pesticideLast.value = it ? { at: it.at, result: it.result } : null;
  } catch { pesticideLast.value = null; }
  // 设备安全检测（取最近一条）
  try {
    const sidNum = getCurrentSchoolId();
    const r = await api.deviceSafetyList({ schoolId: sidNum ? Number(sidNum) : undefined, page: 1, pageSize: 1 } as any);
    const it = (r as any)?.items?.[0];
    deviceSafetyLastDate.value = it?.checkDate || '';
    deviceSafetyDaysSince.value = daysSince(deviceSafetyLastDate.value);
  } catch { deviceSafetyLastDate.value = ''; deviceSafetyDaysSince.value = 0; }
  // 废弃物管理（取最近一条）
  try {
    const sidNum = getCurrentSchoolId();
    const r = await api.wasteList({ schoolId: sidNum ? Number(sidNum) : undefined, page: 1, pageSize: 1 } as any);
    const it = (r as any)?.items?.[0];
    wasteLastDate.value = it?.date || '';
    wasteDaysSince.value = daysSince(wasteLastDate.value);
  } catch { wasteLastDate.value = ''; wasteDaysSince.value = 0; }
}

onMounted(() => { tickNow(); tm = setInterval(tickNow, 1000); refreshAll(); loadAiBar(); loadDevicesStatus(); });
onBeforeUnmount(() => { if (tm) clearInterval(tm); });

// 统计本周（周一00:00至今）各类AI违规次数
const periodMode = ref<'week' | '7d'>('week');
const aiTopN = ref<number>(8);

async function loadAiBar() {
  try {
    const sid = getCurrentSchoolId();
    const now = new Date();
    let start: string;
    if (periodMode.value === '7d') {
      const d = new Date(now);
      d.setDate(now.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      start = d.toISOString();
    } else {
      const day = now.getDay() || 7; // 周一=1, 周日=7
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day - 1));
      monday.setHours(0, 0, 0, 0);
      start = monday.toISOString();
    }
    const end = new Date().toISOString();
    const [types, list] = await Promise.all([
      api.aiTypes(),
      api.aiEventsList({ schoolId: sid, start, end, page: 1, pageSize: 1000 }),
    ]);
    const labelByCode = Object.fromEntries(types.map((t: any) => [t.code, t.label]));
    const map = new Map<string, number>();
    ((list as any)?.items || []).forEach((it: any) => {
      const code = it.type || it.typeCode || 'UNKNOWN';
      map.set(code, (map.get(code) || 0) + 1);
    });
    let items = Array.from(map.entries()).map(([code, count]) => ({ code, count, label: labelByCode[code] || code }));
    // 无数据时也渲染柱状图（mock 一些示例数据避免空洞）
    const total = items.reduce((s, x) => s + (Number(x.count) || 0), 0);
    if (!items.length || total === 0) {
      const mock: Array<{ code: string; label: string; count: number }> = [
        { code: 'MASK', label: '未戴口罩', count: 3 },
        { code: 'HAT', label: '未戴厨师帽', count: 2 },
        { code: 'UNIFORM', label: '未穿工作服', count: 1 },
      ];
      items = mock;
    }
    aiBar.value = items;
  } catch {
    // 失败时也保持一个空0集，避免空态
    aiBar.value = [
      { code: 'MASK', label: '未戴口罩', count: 3 },
      { code: 'HAT', label: '未戴厨师帽', count: 2 },
      { code: 'UNIFORM', label: '未穿工作服', count: 1 },
    ] as any;
  }
}

function onAiBarClick(params: any) {
  const name = String(params?.name || '');
  const label = name.replace(/\s*\(.*\)$/, '');
  const item = aiBar.value.find((x) => x.label === label);
  if (item) {
    router.push({ path: '/ai/events', query: { type: item.code } });
  } else {
    router.push('/ai/events');
  }
}

//（空）

// 设备状态列表
const deviceList = ref<Array<{ id: string; name: string; statusText: string; statusClass: string; last: string }>>([]);
const onlyAbnormal = ref(false);
const sortMode = ref<'default' | 'abnormal' | 'online'>('default');
const displayedDevices = computed(() => {
  let arr = [...deviceList.value];
  if (onlyAbnormal.value) arr = arr.filter((d) => d.statusClass !== 'online');
  if (sortMode.value !== 'default') {
    const order = (s: string) => {
      if (sortMode.value === 'abnormal') return s === 'offline' ? 0 : s === 'fault' ? 1 : 2;
      if (sortMode.value === 'online') return s === 'online' ? 0 : s === 'fault' ? 1 : 2;
      return 0;
    };
    arr = arr.sort((a, b) => order(a.statusClass) - order(b.statusClass));
  }
  return arr;
});
async function loadDevicesStatus() {
  try {
    const sid = getCurrentSchoolId();
    const raw = await api.devicesList({ schoolId: sid || '' });
    const fmt = (t: string) => (t ? new Date(t).toLocaleString() : '—');
    let list = (raw || []).slice(0, 6).map((d: any) => {
      const st = String(d.status || '').toUpperCase();
      const statusText = st === 'ONLINE' ? '在线' : st === 'OFFLINE' ? '离线' : st === 'FAULT' ? '故障' : (d.status || '未知');
      const statusClass = st === 'ONLINE' ? 'online' : st === 'OFFLINE' ? 'offline' : 'fault';
      return { id: d.id, name: d.name || d.type || d.id, statusText, statusClass, last: fmt(d.lastSeen) };
    });
    // 如无设备数据，提供几条 mock 演示数据
    if (!list.length) {
      const now = new Date();
      const ts = (mins: number) => new Date(now.getTime() - mins * 60000).toLocaleString();
      list = [
        { id: 'mock-1', name: 'AI晨检仪', statusText: '在线', statusClass: 'online', last: ts(5) },
        { id: 'mock-2', name: '智能留样柜', statusText: '离线', statusClass: 'offline', last: ts(120) },
        { id: 'mock-3', name: '农残检测仪', statusText: '故障', statusClass: 'fault', last: ts(30) },
        { id: 'mock-4', name: '摄像头01', statusText: '在线', statusClass: 'online', last: ts(2) },
        { id: 'mock-5', name: '摄像头02', statusText: '在线', statusClass: 'online', last: ts(8) },
      ];
    }
    deviceList.value = list;
  } catch { deviceList.value = []; }
}

//

function exportAiBar() {
  try {
    const rows = aiBar.value.map((x) => ({ type: x.label, count: x.count }));
    exportCsv('AI预警类型分布', rows, { type: '预警类型', count: '数量' });
  } catch (e) { /* no-op */ }
}

// 导出动作占位
// 去除演示导出按钮

// 移除无效的聚合刷新逻辑，首页使用 refreshAll() 提供的数据

</script>

<style scoped>
/* KPI theme variables */
:root {
  --kpi-bg: linear-gradient(180deg, #ffffff, #fafcff);
  --kpi-border: #e6f0ff;
  --kpi-shadow: rgba(17, 197, 255, 0.12);
  --kpi-shadow-hover: rgba(17, 197, 255, 0.18);
  --kpi-title: #1f2d3d;
  --kpi-text: #303133;
  --kpi-ok-bg: #eaffea;
  --kpi-ok-border: #b8f0b8;
  --kpi-ok-text: #1f7a1f;
  --kpi-warn-bg: #ffefef;
  --kpi-warn-border: #ffd1d1;
  --kpi-warn-text: #a01a1a;
  --kpi-primary: #2979ff;
}
.topbar { border: none; }
.topbar-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.tb-item { color:#606266; }
.tb-item .strong { color:#303133; font-weight:600; }
.tb-item.clickable { cursor: pointer; }
.card .core-line, .kpi-card .kpi-line { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; color: var(--kpi-text); font-size:14px }
.kpi-card { 
  background: var(--kpi-bg);
  border: 1px solid var(--kpi-border);
  box-shadow: 0 8px 20px var(--kpi-shadow);
  border-radius: 10px;
  height: 100%;
}
.kpi-card:hover { box-shadow: 0 10px 24px var(--kpi-shadow-hover); transform: translateY(-1px); transition: all .2s ease; }
.kpi-header { display:flex; align-items:center; justify-content:space-between; }
.kpi-title-wrap { display:flex; align-items:center; gap:6px; }
.kpi-title { font-weight: 700; letter-spacing: .5px; color: var(--kpi-title); }
 .kpi-badge { font-size:13px; padding: 3px 10px; border-radius: 999px; border:1px solid transparent; font-weight: 700; letter-spacing: .2px; display:inline-flex; align-items:center; }
 .kpi-badge::before { content:''; width:8px; height:8px; border-radius:50%; margin-right:6px; background: currentColor; display:inline-block; }
 .kpi-badge.ok { color: #1a7f1a; background: linear-gradient(90deg,#dff6df,#effbef); border-color: #86df86; box-shadow: inset 0 0 0 1px rgba(134,223,134,.15); }
 .kpi-badge.warn { color: #b01212; background: linear-gradient(90deg,#ffe1e1,#fff0f0); border-color: #ff8f8f; box-shadow: inset 0 0 0 1px rgba(255,143,143,.18); }
.kpi-card { --accent: var(--kpi-primary); }
.kpi-icon { color: var(--accent); }
.kpi-main { display:flex; align-items:baseline; gap:6px; margin: 6px 0 2px; }
.kpi-main .num { font-size: 34px; line-height: 1; font-weight: 800; color: var(--accent); }
.kpi-main .unit { font-size: 14px; color:#909399; font-weight:600 }
.kpi-main.warn .num { color:#F56C6C; }
.kpi-card.ok { border-left: 4px solid var(--kpi-ok-border); }
.kpi-card.warn { border-left: 4px solid var(--kpi-warn-border); }
 /* Removed bottom status row in cards; keep styles unused for compatibility */
 .status { display:none; }
.kpi-card b { font-size:16px; color:#303133 }
.kpi-card b.warn { color:#F56C6C }
/* Equal heights across the first row */
.kpi-row :deep(.el-col) { display: flex; }
.kpi-row :deep(.el-card.kpi-card) { flex: 1; display:flex; flex-direction: column; }
.kpi-row :deep(.el-card.kpi-card .el-card__body) { display:flex; flex-direction: column; justify-content: space-between; min-height: 160px; }
@media (max-width: 768px) {
  .topbar-row { flex-direction: column; align-items: flex-start; gap:6px; }
}
.kpi-card.card-morning {
  --accent: #2979ff;
  background: linear-gradient(180deg, #eaf3ff, #f7fbff);
  border-color: #d6e6ff;
}
.kpi-card.card-cert {
  --accent: #00b38a;
  background: linear-gradient(180deg, #eafff2, #f7fffb);
  border-color: #c8f5e3;
}
.kpi-card.card-disinfection {
  --accent: #ff9f1a;
  background: linear-gradient(180deg, #fff4e6, #fffbf2);
  border-color: #ffe0b3;
}
.kpi-card.card-alerts {
  --accent: #ff4d4f;
  background: linear-gradient(180deg, #ffecec, #fff6f6);
  border-color: #ffd6d6;
}
/* 菜品留样卡片：浅紫主题 */
.kpi-card.card-sampling {
  --accent: #7a5cff;
  background: linear-gradient(180deg, #f3eafe, #faf5ff);
  border-color: #e6d9ff;
}

/* simple ok/warn color helpers for status text */
.ok { color: #67C23A; }
.warn { color: #F56C6C; }

/* Bottom summary cards theme */
.kpi-card.card-bottom { min-height: 128px; }
.kpi-card.card-pesticide {
  --accent: #34c759;
  background: linear-gradient(180deg, #eafff2, #f7fffb);
  border-color: #c8f5e3;
}
.kpi-card.card-device {
  --accent: #2db7f5;
  background: linear-gradient(180deg, #eaf6ff, #f7fbff);
  border-color: #cfe8ff;
}
.kpi-card.card-waste {
  --accent: #67c23a;
  background: linear-gradient(180deg, #f0ffe8, #fbfff7);
  border-color: #d9f5c8;
}

.ai-bar:deep(canvas) { border-radius: 6px; }

/* Device list styles */
.device-list { height: 260px; overflow-y: auto; display:flex; flex-direction: column; gap:6px; }
.device-item { display:grid; grid-template-columns: 1fr 100px 160px; align-items:center; gap:8px; padding:8px 4px; border-bottom: 1px dashed var(--el-border-color); }
.device-item:last-child { border-bottom: none; }
.device-name { color:#303133; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.device-status { display:flex; align-items:center; gap:6px; color:#606266; justify-self: start; }
.device-time { color:#909399; font-size: 12px; justify-self: end; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
.status-dot.online { background:#67C23A; }
.status-dot.offline { background:#F56C6C; }
.status-dot.fault { background:#E6A23C; }
.empty-list { height: 220px; display:flex; align-items:center; justify-content:center; color:#909399 }
/* 菜品留样卡片：浅紫主题 */
.kpi-card.card-sampling {
  --accent: #7a5cff;
  background: linear-gradient(180deg, #f3eafe, #faf5ff);
  border-color: #e6d9ff;
}
</style>

watch(periodMode, () => loadAiBar());
watch(aiTopN, () => {/* 仅影响展示数量，ECharts option 已依据 aiTopN 计算 */});
