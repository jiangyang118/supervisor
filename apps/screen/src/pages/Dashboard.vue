<template>
  <div class="scale-root">
    <div class="screen">
      <header class="banner">
        <div class="left">{{ weather.icon }} {{ weather.text }}｜{{ weather.temp }}℃ ｜ {{ region }}</div>
        <div class="center">智慧食安驾驶舱</div>
        <div class="right">
          {{ ymd }} {{ week }} <span>{{ hms }}</span>
        </div>
      </header>
      <div class="grid">
        <!-- 左列 -->
        <div class="col">
          <PanelCard title="人员健康安全">
            <div class="kpis">
              <KpiTile
                v-for="k in store.kpis"
                :key="k.title"
                :name="k.title"
                :value="k.value"
                :unit="k.unit"
                :warn="k.warn"
              />
            </div>
            <StaffList :items="store.staff" />
          </PanelCard>
          <PanelCard title="证照公示">
            <div class="licenses">
              <DvBorderBox7 v-for="l in store.licenses" :key="l.name" class="lic">
                <div class="lic-inner">
                  <div class="ln">{{ l.name }}</div>
                  <img src='../assets/img/yyzz.png' alt="lic" />
                  <!-- <img :src="l.imageUrl" alt="lic" /> -->
                  
                </div>
              </DvBorderBox7>
            </div>
          </PanelCard>
          <PanelCard title="AI 违规行为占比">
            <PieChart :data="store.pie" />
          </PanelCard>
        </div>
        <!-- 中列 -->
        <div class="col">
          <PanelCard title="明厨亮灶视频墙">
            <VideoWall :videos="store.videos" :grid="4" :rotate="true" :interval="8000" />
          </PanelCard>
          <PanelCard title="农残检测">
            <DvScrollBoard :config="cfgPesticide" style="height: 260px" />
          </PanelCard>
          <PanelCard title="消毒记录">
            <DvScrollBoard :config="cfgDisinfections" style="height: 220px" />
          </PanelCard>
        </div>
        <!-- 右列 -->
        <div class="col">
          <PanelCard title="物联监控">
            <div class="sensors">
              <SensorCard
                v-for="s in store.sensors"
                :key="s.name"
                :name="s.name"
                :value="s.value"
                :unit="s.unit"
                :abnormal="s.abnormal"
                :warnAbove="s.warnAbove"
                :warnBelow="s.warnBelow"
              />
            </div>
          </PanelCard>
          <PanelCard title="菜品留样">
            <DvScrollBoard :config="cfgSamples" style="height: 240px" />
          </PanelCard>
          <PanelCard title="意见与反馈">
           <div class="feedback-card">
            <StaffList :items="store.feedbacks" :meta-keys="['role','phone']" style="flex:1"/>
            <div class="suggest"> 
              用餐意见反馈
              <img  src="../assets/img/erweima.jpg" alt=""/>
              微信扫一扫
            </div>
           </div>
          </PanelCard>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useBaseScale } from '../utils/scale';
import PanelCard from '../components/PanelCard.vue';
import KpiTile from '../components/KpiTile.vue';
import PieChart from '../components/PieChart.vue';
import DataTable from '../components/DataTable.vue';
import VideoWall from '../components/VideoWall.vue';
import SensorCard from '../components/SensorCard.vue';
import StaffList from '../components/StaffList.vue';
import { ScrollBoard as DvScrollBoard, BorderBox7 as DvBorderBox7 } from '@kjgl77/datav-vue3';
import { useDashboardStore } from '../store/dashboard';
import { formatYMD, formatHMS, weekText } from '../utils/format';
import { loadWeatherCached, weatherRefreshIntervalMs, getProvider } from '../api/weather';
import { resolveRegion, autoRegionEnabled } from '../api/location';

const store = useDashboardStore();
const ymd = ref('');
const hms = ref('');
const week = ref('');
let timer: any;
let off: (() => void) | null = null;
function tick() {
  const d = new Date();
  ymd.value = formatYMD(d);
  hms.value = formatHMS(d);
  week.value = weekText(d);
}
onMounted(() => {
  off = useBaseScale();
  tick();
  timer = setInterval(tick, 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  if (tw) clearInterval(tw);
  if (off) off();
});

// Weather + Region
const region = ref((import.meta as any).env?.VITE_REGION || '示例市 · 示例区');
const weather = ref<{ icon: string; text: string; temp: number; kind?: any }>({
  icon: '⛅',
  text: (import.meta as any).env?.VITE_WEATHER_TEXT || '多云',
  temp: Number((import.meta as any).env?.VITE_WEATHER_TEMP || 28),
});
let tw: any;
async function refreshWeather(cityOverride?: string) {
  try {
    const w = await loadWeatherCached(cityOverride);
    weather.value = { icon: w.icon, text: w.text, temp: w.temp, kind: (w as any).kind };
  } catch {
    // keep last
  }
}
onMounted(async () => {
  try {
    if (autoRegionEnabled()) {
      try {
        const r = await resolveRegion();
        region.value = r.display;
      const provider = getProvider();
        if (provider === 'openweather' || provider === 'custom') await refreshWeather(r.city || undefined);
        else await refreshWeather();
      } catch { await refreshWeather(); }
    } else {
      await refreshWeather();
    }
    tw = setInterval(refreshWeather, weatherRefreshIntervalMs());
  } catch {}
});

// DataV ScrollBoard configs
const cfgPesticide = computed(() => ({
  header: ['样品', '结果', '时间'],
  data: store.pesticides.map((r) => [r.sample, r.result, r.at]),
  rowNum: 6,
  carousel: 'single',
  waitTime: 2000,
  headerBGC: 'rgba(17,197,255,.08)',
  oddRowBGC: 'rgba(255,255,255,.02)',
  evenRowBGC: 'rgba(255,255,255,.03)',
  align: ['left', 'center', 'center'],
  headerHeight: 20,
}));
const cfgDisinfections = computed(() => ({
  header: ['类型', '负责人', '时间'],
  data: store.disinfections.map((r) => [r.type, r.by, r.at]),
  rowNum: 6,
  carousel: 'single',
  waitTime: 2000,
  headerBGC: 'rgba(17,197,255,.08)',
  oddRowBGC: 'rgba(255,255,255,.02)',
  evenRowBGC: 'rgba(255,255,255,.03)',
  align: ['left', 'center', 'center'],
  headerHeight: 40,
}));
const cfgSamples = computed(() => ({
  header: ['菜品', '状态', '时间'],
  data: store.samples.map((r) => [r.dish, r.status, r.at]),
  rowNum: 6,
  carousel: 'single',
  waitTime: 2000,
  headerBGC: 'rgba(17,197,255,.08)',
  oddRowBGC: 'rgba(255,255,255,.02)',
  evenRowBGC: 'rgba(255,255,255,.03)',
  align: ['left', 'center', 'center'],
  headerHeight: 40,
}));
const cfgFeedbacks = computed(() => ({
  header: ['姓名', '角色', '电话'],
  data: store.feedbacks.map((f) => [f.name, f.role, f.phone]),
  rowNum: 6,
  carousel: 'single',
  waitTime: 2000,
  headerBGC: 'rgba(17,197,255,.08)',
  oddRowBGC: 'rgba(255,255,255,.02)',
  evenRowBGC: 'rgba(255,255,255,.03)',
  align: ['left', 'left', 'center'],
  headerHeight: 40,
}));
</script>
<style scoped lang="less">
// .scale-root { width: 1920px; height: 1080px; transform-origin: 0 0; transform: scale(var(--scale, 1)); }
.screen {
  background: #061423;
  color: #cde7ff;
  min-height: 100vh;
  padding: 10px;
}
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border: 1px solid rgba(17, 197, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 10px;
}
.banner .left {
  color: #9dccff;
  flex: 1;
}
.banner .center {
  width:30%;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0px 4px 21px rgba(27, 126, 242, 0.64);
}
.banner .right {
  color: #45a2ff;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  display:flex;
  gap:40px;
  span {
    color: rgba(255, 255, 255, 0.87);
    text-shadow: 0px 0px 13px rgba(27, 126, 242, 0.91);
  }
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 10px;
}
.col {
  display: grid;
  gap: 10px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.licenses {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.lic { width: 200px; }
.lic-inner { overflow: hidden; background: #0a1a2a; border: 1px solid rgba(17,197,255,.2); text-align: center; }
.lic-inner img {
  height: 100px;
  object-fit: cover;
  margin: 0px 0 20px 0;
}
.lic-inner .ln {
  text-align: center;
  font-size: 16px;
  padding: 10px 0 10px 0;
}
.sensors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.feedback-card{
  display:flex;
  justify-content: space-between;
  gap:20px;
  .suggest{
    display:flex;
    flex-direction: column;
    text-align: center;
    img{
      width: 100px;
      height: 100px;
      margin-top: 10px;
      align-self: center;
    }
  }
}
</style>
