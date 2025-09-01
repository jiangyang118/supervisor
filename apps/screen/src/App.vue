<template>
  <div class="container">
    <header class="header">
      <div class="h-left">
        <div class="region">{{ region }}</div>
        <div class="weather">
          <WeatherIcon :kind="weather.kind" :size="16" />
          <span>{{ weather.text }}</span>
          <span>{{ weather.temp }}°C</span>
        </div>
      </div>
      <div class="h-center">
        <div class="title-wrap">
          <div class="title-badge">智慧食安驾驶舱</div>
          <dv-decoration-5 class="title-dec" />
        </div>
      </div>
      <div class="h-right">
        <div class="date">{{ ymd }} ｜ {{ week }} ｜ {{ hms }}</div>
       
      </div>
    </header>
    <div class="divider"></div>
    
    <main class="shell">
      
      <!-- 左列 -->
      <div class="row">
        <Card title="人员健康安全" :radius="20">
  
        <div style="display: flex; justify-content: space-between; gap:10px">
          <div class="mc-card">
            <div class="mc-title-bg">
              <div class="mc-title-text">晨检总人数</div>
            </div>
            <div class="mc-content-bg">
              <div class="mc-conent-text">52</div>
            </div>
            <!-- <div class="mc-content-bg">
             
                <div class="mc-total-num">{{ morning.total }}</div>
                <div class="mc-total-unit">人</div>
             
              <div class="mc-subtext">今日累计</div>
            </div> -->
            <!-- <div class="grid-2">
              <NumberTile label="异常" :value="morning.abnormal" />
            </div> -->
            <div class="split-line"></div>
            <!-- <div class="thumbs" v-if="proofs.length">
              <img v-for="(p, i) in proofs.slice(0, 10)" :key="i" class="thumb" :src="p" alt="proof" @click="preview(p)" />
            </div>
            <div v-else class="footer-note">暂无异常证明</div> -->
          </div>
          <div class="mc-card">
            <div class="mc-title-bg">
              <div class="mc-title-text">晨检总人数</div>
            </div>
            <div class="mc-content-bg">
              <div class="mc-conent-text">52</div>
            </div>
            <!-- <div class="mc-content-bg">
             
                <div class="mc-total-num">{{ morning.total }}</div>
                <div class="mc-total-unit">人</div>
             
              <div class="mc-subtext">今日累计</div>
            </div> -->
            <!-- <div class="grid-2">
              <NumberTile label="异常" :value="morning.abnormal" />
            </div> -->
            <div class="split-line"></div>
            <!-- <div class="thumbs" v-if="proofs.length">
              <img v-for="(p, i) in proofs.slice(0, 10)" :key="i" class="thumb" :src="p" alt="proof" @click="preview(p)" />
            </div>
            <div v-else class="footer-note">暂无异常证明</div> -->
          </div>
        </div>
        </Card>

        <Card title="证照公示">
          <!-- <ChartBar :x="progressX" :series="progressSeries" :legend="['晨检','消毒','留样']" /> -->
          <div class="footer-note">目标：≥ 95%</div>
        </Card>

        <Card title="AI违规行为分析">
          <div>
            <div v-if="rank.length === 0" class="footer-note">暂无学校数据</div>
            <div v-for="(s, i) in rank" :key="s.id || s.name" style="display:flex;align-items:center;gap:12px;margin:6px 0">
              <span class="tag" style="width:32px;text-align:center">{{ i+1 }}</span>
              <div style="flex:1">{{ s.name }}</div>
              <div v-if="'score' in s" style="color:var(--primary)">{{ (s as any).score }}</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 中列 -->
      <div class="row">
        <Card title="明厨亮灶">
          <!-- <VideoWall :grid="4" :titles="camTitles" /> -->
        </Card>

        <Card title="农残检测管理">
          <div>
            <div v-if="aiTop.length === 0" class="footer-note">暂无 农残检测管理</div>
            <div v-for="i in aiTop" :key="i.type" style="display:flex;justify-content:space-between;margin:6px 0">
              <span>{{ i.type }}</span>
              <span style="color:var(--primary)">{{ i.count }}</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- 右列 -->
      <div class="row">
        <Card title="物联监控管理">
          <!-- <ChartBar :x="indexX" :series="indexSeries" /> -->
        </Card>

        <Card title="菜品留样管理">
          <div class="grid-2">
            <!-- <NumberTile label="在线摄像头" :value="device.cams" />
            <NumberTile label="AI 算法" :value="device.algos" />
            <NumberTile label="温湿度探头" :value="device.probes" />
            <NumberTile label="预警器" :value="device.warners" /> -->
          </div>
        </Card>

        <Card title="意见与反馈公示">
          <!-- <ChartBar :x="riskX" :series="riskSeries" /> -->
        </Card>
      </div>
    </main>
    <div v-if="showImg" class="lightbox" @click="showImg=false">
      <img class="img" :src="curImg" alt="proof" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Card from './components/Card.vue'

import { useBaseScale } from './utils/scale'
import { api } from './api'
import { loadWeatherCached, weatherRefreshIntervalMs, getProvider } from './api/weather'
import { resolveRegion, autoRegionEnabled } from './api/location'
import WeatherIcon from './components/icons/WeatherIcon.vue'

const meta = { note: '参考 prompt/ui/screen_shian.png' }
const kpis = [
  { title:'晨检总人数（人）', value:52 },
  { title:'异常人数（人）', value:8, status:'warn' as const },
]
const staff = [
  { photoUrl:'/assets/license/a.webp', name:'张三', temperature:'36.4℃', expireText:'到期前7天' },
  { photoUrl:'/assets/license/a.webp', name:'张三', temperature:'36.4℃', expireText:'到期前7天' },
]
const dt = ref(new Date())
let timer: any
let tmMorning: any
function pad(n: number) { return n < 10 ? `0${n}` : String(n) }
const ymd = ref('')
const hms = ref('')
const week = ref('')
function tick() {
  dt.value = new Date()
  const y = dt.value.getFullYear()
  const m = pad(dt.value.getMonth() + 1)
  const d = pad(dt.value.getDate())
  ymd.value = `${y}-${m}-${d}`
  const hh = pad(dt.value.getHours())
  const mm = pad(dt.value.getMinutes())
  const ss = pad(dt.value.getSeconds())
  hms.value = `${hh}:${mm}:${ss}`
  const w = dt.value.getDay()
  week.value = ['周日','周一','周二','周三','周四','周五','周六'][w]
}

const region = ref((import.meta as any).env?.VITE_REGION || '示例市 · 示例区')
const weather = ref({ icon: '⛅', text: (import.meta as any).env?.VITE_WEATHER_TEXT || '多云', temp: Number((import.meta as any).env?.VITE_WEATHER_TEMP || 28) })

async function refreshWeather(cityOverride?: string) {
  try {
    const w = await loadWeatherCached(cityOverride)
    weather.value = { icon: w.icon, text: w.text, temp: w.temp, kind: w.kind as any }
  } catch {
    // keep current weather value on failure
  }
}

function morningRefreshMs() {
  const sec = Number((import.meta as any).env?.VITE_MORNING_REFRESH_SEC || 300)
  return (isFinite(sec) && sec > 0 ? sec : 300) * 1000
}

const currentSchoolId = ref<string | undefined>(undefined)

onMounted(async () => {
  const off = useBaseScale()
  tick(); timer = setInterval(tick, 1000)
  // Auto region
  if (autoRegionEnabled()) {
    try {
      const r = await resolveRegion()
      region.value = r.display
      // if using city-based provider, pass city for better accuracy
      const provider = getProvider()
      if (provider === 'openweather' || provider === 'custom') {
        await refreshWeather(r.city || undefined)
      } else {
        await refreshWeather()
      }
    } catch { await refreshWeather() }
  } else {
    await refreshWeather()
  }
  const tw = setInterval(refreshWeather, weatherRefreshIntervalMs())
  // Try loading online data
  try {
    const schools = await api.regSchools()
    if (schools?.length) {
      rank.value = schools.slice(0, 6)
      // Load cameras for the first school to show titles
      currentSchoolId.value = schools[0].id
      const cams = await api.regCameras(currentSchoolId.value)
      camTitles.value = (cams || []).slice(0, 4).map((c: any) => c.name || '通道')
      // Load morning checks for header stats
      await refreshMorning(currentSchoolId.value)
    }
  } catch {}
  try {
    const events = await api.regAiEvents({ page: 1, pageSize: 100 })
    if (Array.isArray(events?.items)) {
      const map = new Map<string, number>()
      for (const it of events.items) {
        const k = (it.type || it.eventType || it.label || '其他') as string
        map.set(k, (map.get(k) || 0) + 1)
      }
      aiTop.value = Array.from(map.entries()).slice(0, 6).map(([type, count]) => ({ type, count }))
      const total = events.total || events.items.length
      warn.value = { high: Math.floor(total * 0.2), mid: Math.floor(total * 0.3), low: total - Math.floor(total * 0.5), closed: Math.floor(total * 0.4) }
      warnPie.value = [
        { name: '高', value: warn.value.high },
        { name: '中', value: warn.value.mid },
        { name: '低', value: warn.value.low }
      ]
    }
  } catch {}
  // periodic refresh for morning stats
  tmMorning = setInterval(() => refreshMorning(currentSchoolId.value), morningRefreshMs())
  onBeforeUnmount(() => { off(); clearInterval(timer); clearInterval(tw); clearInterval(tmMorning) })
})

const warn = ref({ high: 6, mid: 14, low: 28, closed: 30 })
const warnPie = ref([
  { name: '高', value: warn.value.high },
  { name: '中', value: warn.value.mid },
  { name: '低', value: warn.value.low }
])

const progressX = ['晨检', '消毒', '留样']
const progressSeries = [
  { name: '完成率', data: [92, 88, 90] }
]

const rank = ref<any[]>([])
const camTitles = ref<string[]>(['加工区','清洗区','备餐区','库房'])

const aiTop = ref<{ type: string; count: number }[]>([])

const indexX = ['食材', '人员', '环境', '流程', '台账']
const indexSeries = [
  { name: '指数', data: [92, 86, 88, 90, 94] }
]

const device = ref({ cams: 124, algos: 16, probes: 58, warners: 22 })

const riskX = ['整改中', '已关闭', '新增']
const riskSeries = [
  { name: '数量', data: [12, 44, 8] }
]

// Header: morning check stats + proofs
const morning = ref({ total: 0, abnormal: 0 })
const proofs = ref<string[]>([])
const showImg = ref(false)
const curImg = ref('')
function preview(src: string) { curImg.value = src; showImg.value = true }
async function refreshMorning(schoolId?: string) {
  try {
    const res = await api.morningChecks({ schoolId, page: 1, pageSize: 100 })
    const items = Array.isArray(res?.items) ? res.items : []
    morning.value.total = Number(res?.total ?? items.length)
    const abns = items.filter((r: any) => r.result === '异常' || r.health === 1 || r.abnormalTemp === 1 || (Array.isArray(r.handCheckResult) && r.handCheckResult.length) || (Array.isArray(r.healthAskResult) && r.healthAskResult.length))
    morning.value.abnormal = abns.length
    const imgs: string[] = []
    for (const it of abns) {
      const im = it.images || {}
      for (const k of ['face','palm','backOfHand']) {
        if (im[k]) imgs.push(String(im[k]))
      }
      if (it.portraitUrl) imgs.push(String(it.portraitUrl))
      if (it.healthCertUrl) imgs.push(String(it.healthCertUrl))
      if (it.proofUrl) imgs.push(String(it.proofUrl))
      if (Array.isArray(it.photos)) imgs.push(...it.photos.map((x: any) => String(x)))
    }
    proofs.value = Array.from(new Set(imgs)).filter(Boolean)
  } catch {
    morning.value = { total: 0, abnormal: 0 }
    proofs.value = []
  }
}
 </script>
 <style lang="less" scoped>
 .grid2{
  display:grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px;
}
.morning-check{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 17px;
  color: #fff;
  &-title{
    background:url('./assets/img/morningCheckTitle.png') no-repeat center;
    background-size: 100% 100%;
  }
  &-content{
    background:url('./assets/img/morningCheckConent.png') no-repeat center;
    background-size: 100% 100%;
  }
}
</style>
