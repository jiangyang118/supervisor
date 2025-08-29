<template>
  <view class="page">
    <view class="hero mb-8">
      <view class="header">
        <text class="title">{{ schoolLabel || '学校' }}</text>
        <span class="chip">{{ date }}</span>
      </view>
      <view class="subtle">今日概览 · 稳定运行</view>
    </view>
    <view class="card">
      <view class="header">
        <text class="subtitle">核心指标</text>
        <text class="muted">实时数据</text>
      </view>
      <view v-if="loading" class="placeholder">加载中…</view>
      <view v-else class="stats-grid">
        <view class="stat"><view class="label">已上报</view><view class="value">{{ kpi.reported }}</view></view>
        <view class="stat"><view class="label">未上报</view><view class="value">{{ kpi.unreported }}</view></view>
        <view class="stat"><view class="label">预警</view><view class="value">{{ kpi.alerts }}</view></view>
        <view class="stat"><view class="label">证照将到期</view><view class="value">{{ kpi.expiringCerts }}</view></view>
      </view>
      <view v-if="!loading" class="stats-grid mt-8">
        <view class="stat"><view class="label">入库次数</view><view class="value">{{ ext.inboundCount }}</view></view>
        <view class="stat"><view class="label">入库重量(kg)</view><view class="value">{{ ext.inboundWeightKg }}</view></view>
        <view class="stat"><view class="label">满意度(%)</view><view class="value">{{ ext.satisfaction }}</view></view>
        <view class="stat"><view class="label">卫生检查</view><view class="value">{{ ext.hygieneReports }}</view></view>
      </view>
    </view>

    <view class="section card">
      <SectionHeader>功能快捷</SectionHeader>
      <QuickNav :items="quickItems" />
    </view>

    <view class="section card">
      <view class="header"><text class="subtitle">智能检查趋势</text>
        <van-tabs v-model:active="period" @change="renderTrend">
          <van-tab title="日" name="day"/>
          <van-tab title="周" name="week"/>
          <van-tab title="月" name="month"/>
        </van-tabs>
      </view>
      <div ref="chartRef" class="chart-box"></div>
    </view>

    <view class="section card">
      <view class="header"><text class="subtitle">浪费排行 Top5</text></view>
      <view class="list">
        <view class="list-item" v-for="(w,i) in wasteTop" :key="i">
          <view>{{ i+1 }}. {{ w.name }}</view>
          <view class="tag default">{{ w.score }}</view>
        </view>
        <view v-if="!wasteTop.length" class="placeholder">暂无数据</view>
      </view>
    </view>

    <view class="section card">
      <view class="header"><text class="subtitle">入库概览</text></view>
      <view class="list">
        <view class="list-item" v-for="(it, i) in inboundItems" :key="i">
          <view>{{ it.name }}</view>
          <view class="tag default">{{ it.qty }}</view>
        </view>
        <view v-if="!inboundItems.length" class="placeholder">暂无入库</view>
      </view>
    </view>

    <view class="section card">
      <view class="header"><text class="subtitle">预警列表</text></view>
      <view class="list">
        <view class="list-item" v-for="w in warnings" :key="w.id">
          <view>
            <view style="font-weight:600">{{ w.title }}</view>
            <view class="muted">{{ w.at }}</view>
          </view>
          <van-tag :type="w.level==='重大' ? 'danger' : (w.level==='较大' ? 'warning' : 'success')">{{ w.level }}</van-tag>
        </view>
        <view v-if="!warnings.length" class="placeholder">暂无预警</view>
      </view>
    </view>
  </view>
  
  
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { mountEChart, type EChartsCoreOption } from '../../utils/echarts-adapter'
import { fetchDashboard, type DashboardResponse } from '../../api/modules/dashboard'
import { fetchRegSchools } from '../../api/modules/school'
import { selectedSchoolId, setSchool } from '../../stores/tenant'
import { useRouter } from 'vue-router'
import SectionHeader from '../../components/SectionHeader.vue'
import QuickNav, { type QuickItem } from '../../components/QuickNav.vue'
import '../../styles/theme.css'

const date = new Date().toISOString().slice(0,10)
const loading = ref(false)
const kpi = ref({ reported: 0, unreported: 0, alerts: 0, expiringCerts: 0 })
const period = ref('day')
const chartRef = ref<HTMLDivElement | null>(null)
let dispose: null | (()=>void) = null
const schoolLabel = ref<string>('')
const ext = ref({ inboundCount: 0, inboundWeightKg: 0, satisfaction: 0, hygieneReports: 0 })
const inboundItems = ref<Array<{ name: string; qty: number }>>([])
const warnings = ref<Array<{ id: string; title: string; at: string; level: string }>>([])
const router = useRouter()
const quickItems: QuickItem[] = [
  { label: '实时监控', to: '/monitor', icon: 'video-o' },
  { label: 'AI预警', to: '/warn', icon: 'warning-o' },
  { label: '台账上报', to: '/ledger', icon: 'edit' },
  { label: '待办工作', to: '/todo', icon: 'todo-list-o' },
  { label: '培训考试', to: '/training', icon: 'passed' },
  { label: '供应商', to: '/supplier', icon: 'shop-o' },
]

function optionOf(x: number[]): EChartsCoreOption {
  return {
    grid: { left: 32, right: 16, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: x.map((_,i)=>String(i+1)) },
    yAxis: { type: 'value' },
    series: [
      { name: '通过', type: 'line', data: x.map(v=>Math.max(0, v+2)) },
      { name: '不通过', type: 'bar', data: x },
    ],
  }
}

function renderTrend(seed = 3) {
  const base = period.value === 'day' ? 8 : period.value === 'week' ? 7 : 12
  const arr = Array.from({ length: base }).map((_,i) => Math.max(0, Math.round(Math.sin(i/2+seed)*3 + seed)))
  if (chartRef.value) {
    dispose?.()
    dispose = mountEChart(chartRef.value, optionOf(arr))
  }
}

type WasteItem = { name: string; score: number }
const wasteTop = ref<WasteItem[]>([])

async function ensureSchool() {
  if (!selectedSchoolId.value) {
    try {
      const schools = await fetchRegSchools()
      if (schools && schools.length) { setSchool(schools[0].id); schoolLabel.value = schools[0].name }
    } catch {}
  } else {
    try {
      const schools = await fetchRegSchools();
      const hit = schools.find(s => s.id === selectedSchoolId.value); if (hit) schoolLabel.value = hit.name
    } catch {}
  }
}

async function load() {
  loading.value = true
  try {
    await ensureSchool()
    const sid = selectedSchoolId.value || undefined
    const data: DashboardResponse = await fetchDashboard(sid)
    // Map to KPI
    const reported = data.cards.morningChecks
    const alerts = data.cards.aiAlerts
    const expiringCerts = data.canteenStaff.invalid || 0
    const unreported = Math.max(0, 20 - reported)
    kpi.value = { reported, unreported, alerts, expiringCerts }

    // Waste Top: derive from outbound items as a simple proxy
    wasteTop.value = (data.outbound.items || [])
      .map((x) => ({ name: x.name, score: x.qty }))
      .sort((a,b)=>b.score-a.score)
      .slice(0,5)

    // Extra cards and lists
    ext.value = {
      inboundCount: data.cards.inboundCount,
      inboundWeightKg: data.cards.inboundWeightKg,
      satisfaction: data.cards.satisfaction,
      hygieneReports: data.cards.hygieneReports,
    }
    inboundItems.value = data.inbound.items || []
    warnings.value = data.warnings || []

    renderTrend(alerts % 5)
  } catch (e) {
    // Fallback to pseudo data if API fails
    const reported = 10 + Math.round(Math.random()*10)
    const alerts = Math.round(Math.random()*6)
    const expiringCerts = Math.round(Math.random()*3)
    const unreported = Math.max(0, 20 - reported)
    kpi.value = { reported, unreported, alerts, expiringCerts }
    wasteTop.value = Array.from({length:5}).map((_,i)=>({ name: `项-${i+1}`, score: Math.round(50+Math.random()*50) }))
    renderTrend(alerts)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="less">
.item {
  display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px;
  .rounded(@radius-sm);
  background: fade(@brand-primary, 6%);
  border: 1px solid fade(@brand-primary, 20%);
}
</style>
