<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <span>环境监测管理</span>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <!-- <el-switch v-model="onlyAlerts" active-text="仅显示报警" />
          <el-switch v-model="simulate" active-text="模拟数据" @change="onSimChange" />
          <el-divider direction="vertical" />
          <el-button @click="refresh" type="primary">刷新</el-button>
          <el-switch v-model="autoRefresh" active-text="自动刷新" /> -->
        </div>
      </div>
    </template>

    <!-- 温度/湿度 -->
    <div class="group">
      <div class="group-title">温度/湿度</div>
      <div v-if="compTh.length === 0" class="empty-wrap"><el-empty description="暂无数据" :image-size="70" /></div>
      <div v-else class="grid">
        <div class="card" v-for="it in compTh" :key="it.id" :class="{ danger: it.alert }">
          <div class="title">{{ it.title }}</div>
          <div class="meta" v-if="it.name || it.location">
            <span v-if="it.name">{{ it.name }}</span>
            <span v-if="it.location" class="dot" />
            <span v-if="it.location">{{ it.location }}</span>
          </div>
          <div class="value" :class="{ warn: it.alert }">{{ it.value }}</div>
          <div class="time" v-if="it.lastSeen">更新时间：{{ it.lastSeen }}</div>
          <div class="status">
            <el-tag :type="it.alert ? 'danger' : 'success'" effect="plain">{{ it.alert ? '报警' : '正常' }}</el-tag>
          </div>
          <div class="actions">
            <el-button  @click="openHistory(it)">查看历史</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 燃气传感器 -->
    <div class="group">
      <div class="group-title">燃气传感器</div>
      <div v-if="compGas.length === 0" class="empty-wrap"><el-empty description="暂无数据" :image-size="70" /></div>
      <div v-else class="grid">
        <div class="card" v-for="it in compGas" :key="it.id" :class="{ danger: it.alert }">
          <div class="title">{{ it.title }}</div>
          <div class="meta" v-if="it.name || it.location">
            <span v-if="it.name">{{ it.name }}</span>
            <span v-if="it.location" class="dot" />
            <span v-if="it.location">{{ it.location }}</span>
          </div>
          <div class="value" :class="{ warn: it.alert }">{{ it.value }}</div>
          <div class="time" v-if="it.lastSeen">更新时间：{{ it.lastSeen }}</div>
          <div class="status">
            <el-tag :type="it.alert ? 'danger' : 'success'" effect="plain">{{ it.alert ? '报警' : '正常' }}</el-tag>
          </div>
          <div class="actions">
            <el-button  @click="openHistory(it)">查看历史</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 烟雾传感器 -->
    <div class="group">
      <div class="group-title">烟雾传感器</div>
      <div v-if="compSmoke.length === 0" class="empty-wrap"><el-empty description="暂无数据" :image-size="70" /></div>
      <div v-else class="grid">
        <div class="card" v-for="it in compSmoke" :key="it.id" :class="{ danger: it.alert }">
          <div class="title">{{ it.title }}</div>
          <div class="meta" v-if="it.name || it.location">
            <span v-if="it.name">{{ it.name }}</span>
            <span v-if="it.location" class="dot" />
            <span v-if="it.location">{{ it.location }}</span>
          </div>
          <div class="value" :class="{ warn: it.alert }">{{ it.value }}</div>
          <div class="time" v-if="it.lastSeen">更新时间：{{ it.lastSeen }}</div>
          <div class="status">
            <el-tag :type="it.alert ? 'danger' : 'success'" effect="plain">{{ it.alert ? '报警' : '正常' }}</el-tag>
          </div>
          <div class="actions">
            <el-button  @click="openHistory(it)">查看历史</el-button>
          </div>
        </div>
      </div>
    </div>
  </el-card>

  <el-dialog v-model="historyVisible" :title="historyTitle" width="720px">
    <canvas ref="chart" width="660" height="260" style="border:1px solid #eee"></canvas>
    <template #footer>
      <el-button @click="historyVisible=false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';

type Device = { id: string; name: string; type: string; status: string; location?: string; lastSeen: string; metrics?: Record<string, any> };
const sensors = ref<Device[]>([]);
const gasAndSmoke = ref<Device[]>([]);
const autoRefresh = ref(true);
const onlyAlerts = ref(false);
const simulate = ref(true);
let timer: any = null;

type PanelItem = { id: string; title: string; value: string; alert: boolean; seriesKey: string; name?: string; location?: string; lastSeen?: string };
const groups = reactive<{ th: PanelItem[]; gas: PanelItem[]; smoke: PanelItem[] }>({ th: [], gas: [], smoke: [] });
// series storage by key to keep history across refresh
const seriesMap: Record<string, number[]> = {};
function getSeries(key: string): number[] { return seriesMap[key] || (seriesMap[key] = []); }
function pushSeries(key: string, point?: number) {
  if (typeof point !== 'number') return;
  const arr = getSeries(key);
  arr.push(point);
  if (arr.length > 60) arr.shift();
}
function alpha(n: number): string { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return '传感器' + (A[n % 26] || ''); }

async function load() {
  const qs = new URLSearchParams();
  const sid = getCurrentSchoolId();
  if (sid) qs.set('schoolId', String(sid));
  try {
    if (simulate.value) {
      populateSimulated();
      return;
    }
    const sensorList = await fetch(`/api/school/devices?type=SENSOR&${qs.toString()}`).then((r)=>r.json());
    const smokeList = await fetch(`/api/school/devices?type=SMOKE&${qs.toString()}`).then((r)=>r.json());
    sensors.value = sensorList as Device[];
    gasAndSmoke.value = ([...sensorList, ...smokeList] as Device[]);
    updatePanels();
  } catch { ElMessage.error('加载设备失败'); }
}
function updatePanels() {
  groups.th = [];
  groups.gas = [];
  groups.smoke = [];
  let anyAlert = false;
  // 温湿度：取所有包含 temp/humidity 的 SENSOR 设备
  const thList = (sensors.value || []).filter((d)=> d.metrics && (d.metrics.temp!==undefined || d.metrics.humidity!==undefined))
    .sort((a,b)=> String(a.name||a.id).localeCompare(String(b.name||b.id)));
  thList.forEach((d, i) => {
    const t = d.metrics?.temp;
    const h = d.metrics?.humidity;
    const val = `${t!==undefined? t+'°C':'-'} / ${h!==undefined? h+'%RH':'-'}`;
    const alert = d.status==='FAULT' || (typeof t==='number' && (t<0 || t>45));
    const key = `th:${d.id}`;
    pushSeries(key, typeof t==='number'? t: undefined);
    groups.th.push({ id: d.id+':th', title: alpha(i), value: val, alert, seriesKey: key, name: d.name, location: d.location, lastSeen: d.lastSeen });
    if (alert) anyAlert = true;
  });
  // 燃气：任何存在 metrics.gas 的设备
  const gasList = (gasAndSmoke.value || []).filter((d)=> d.metrics && d.metrics.gas!==undefined)
    .sort((a,b)=> String(a.name||a.id).localeCompare(String(b.name||b.id)));
  gasList.forEach((d, i) => {
    const gas = Number(d.metrics?.gas || 0);
    const alert = d.status==='FAULT' || gas > 0;
    const key = `gas:${d.id}`;
    pushSeries(key, gas);
    groups.gas.push({ id: d.id+':gas', title: alpha(i), value: `${gas}%`, alert, seriesKey: key, name: d.name, location: d.location, lastSeen: d.lastSeen });
    if (alert) anyAlert = true;
  });
  // 烟雾：SMOKE 类型或 metrics.smoke
  const smokeList = (gasAndSmoke.value || []).filter((d)=> d.type==='SMOKE' || (d.metrics && d.metrics.smoke!==undefined))
    .sort((a,b)=> String(a.name||a.id).localeCompare(String(b.name||b.id)));
  smokeList.forEach((d, i) => {
    const on = d.metrics?.smoke===1 || d.status==='FAULT';
    const key = `smoke:${d.id}`;
    pushSeries(key, on ? 1 : 0);
    groups.smoke.push({ id: d.id+':smoke', title: alpha(i), value: on ? '报警' : '正常', alert: on, seriesKey: key, name: d.name, location: d.location, lastSeen: d.lastSeen });
    if (on) anyAlert = true;
  });
  if (anyAlert) beep();
}
function refresh() { load(); }
watch(autoRefresh, (v)=>{ if (v) startTimer(); else stopTimer(); });
function startTimer() { stopTimer(); timer = setInterval(load, 5000); }
function stopTimer() { if (timer) { clearInterval(timer); timer=null; } }

// History modal
const historyVisible = ref(false);
const historyTitle = ref('');
const chart = ref<HTMLCanvasElement|null>(null);
function openHistory(p: any) { historyTitle.value = `${p.title} 历史趋势`; historyVisible.value = true; setTimeout(()=> drawChart(seriesMap[p.seriesKey] || []), 0); }
function drawChart(series: number[]) {
  const cv = chart.value; if (!cv) return; const ctx = cv.getContext('2d')!; const w=cv.width, h=cv.height; ctx.clearRect(0,0,w,h);
  // layout paddings
  const padL = 46, padR = 12, padT = 12, padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  // axes
  ctx.strokeStyle='#ccc'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); // X axis
  ctx.moveTo(padL, padT);     ctx.lineTo(padL, h - padB);     // Y axis
  ctx.stroke();

  const data = series.length ? series : [0];
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;

  // ticks style
  ctx.fillStyle = '#666';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Y ticks (5 levels)
  const yLevels = 5;
  const yDecimals = range < 5 ? 1 : 0;
  for (let i = 0; i <= yLevels; i++) {
    const t = i / yLevels;
    const val = min + (range * (1 - t));
    const y = padT + innerH * t;
    // grid
    ctx.strokeStyle = i === yLevels ? '#ccc' : '#eee';
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    // label
    ctx.fillStyle = '#666';
    ctx.fillText(val.toFixed(yDecimals), padL - 6, y);
  }

  // X ticks (0%,25%,50%,75%,100%)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const tickPos = [0, 0.25, 0.5, 0.75, 1];
  const n = Math.max(1, data.length - 1);
  tickPos.forEach((p) => {
    const idx = Math.round(n * p);
    const x = padL + innerW * (idx / n);
    // grid line
    ctx.strokeStyle = p === 0 ? '#ccc' : '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, h - padB);
    ctx.stroke();
    // label: show 1-based index
    ctx.fillStyle = '#666';
    ctx.fillText(String(idx + 1), x, h - padB + 6);
  });

  // series line
  ctx.strokeStyle = '#409EFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = padL + innerW * (i / Math.max(1, data.length - 1));
    const y = padT + innerH * (1 - (v - min) / range);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Simple beep using WebAudio
let ac: AudioContext | null = null;
function beep() {
  try {
    // create on first use to avoid autoplay policy
    if (!ac) ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type='square'; o.frequency.value=800; g.gain.value=0.05;
    o.connect(g); g.connect(ac.destination);
    o.start(); setTimeout(()=>{ o.stop(); }, 200);
  } catch {}
}

onMounted(()=>{ load(); if (autoRefresh.value) startTimer(); });
onBeforeUnmount(()=> stopTimer());

// Computed filtered groups
const compTh = computed(() => onlyAlerts.value ? groups.th.filter(x=>x.alert) : groups.th);
const compGas = computed(() => onlyAlerts.value ? groups.gas.filter(x=>x.alert) : groups.gas);
const compSmoke = computed(() => onlyAlerts.value ? groups.smoke.filter(x=>x.alert) : groups.smoke);

// Simulation support
function rand(min: number, max: number) { return Math.round(min + Math.random()*(max-min)); }
function nowStr() { const d=new Date(); const p=(n:number)=> String(n).padStart(2,'0'); return `${d.getHours()}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }
function populateSimulated() {
  // Build 3 温湿度, 2 燃气, 2 烟感
  const baseTH: Device[] = Array.from({ length: 3 }).map((_, i) => ({
    id: `sim-th-${i}`,
    name: ['冷藏库','粗加工间','备餐间'][i] || `温湿点${i+1}`,
    type: 'SENSOR',
    status: 'OK',
    location: ['库房A','一层','二层'][i] || '未知',
    lastSeen: nowStr(),
    metrics: { temp: rand(2, 10) + (i===1? rand(15, 28): 0), humidity: rand(40, 75) },
  }));
  const baseGas: Device[] = Array.from({ length: 2 }).map((_, i) => ({
    id: `sim-gas-${i}`,
    name: ['灶台区','蒸箱区'][i] || `燃气点${i+1}`,
    type: 'SENSOR',
    status: i===1 && Math.random()<0.2 ? 'FAULT' : 'OK',
    location: ['后厨A','后厨B'][i] || '未知',
    lastSeen: nowStr(),
    metrics: { gas: Math.random()<0.2 ? rand(5, 20) : 0 },
  }));
  const baseSmoke: Device[] = Array.from({ length: 2 }).map((_, i) => ({
    id: `sim-smoke-${i}`,
    name: ['走廊','库房'][i] || `烟感点${i+1}`,
    type: 'SMOKE',
    status: 'OK',
    location: ['一层','库房A'][i] || '未知',
    lastSeen: nowStr(),
    metrics: { smoke: Math.random()<0.1 ? 1 : 0 },
  }));
  sensors.value = [...baseTH, ...baseGas];
  gasAndSmoke.value = [...baseTH, ...baseGas, ...baseSmoke];
  updatePanels();
}
function onSimChange() {
  // clear series to avoid mixing real/sim
  for (const k of Object.keys(seriesMap)) delete seriesMap[k];
  load();
}
</script>

<style scoped>
.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
.card { border:1px solid #e5e5e5; border-radius:6px; padding:12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.card.danger { border-color:#f56c6c; box-shadow: 0 1px 6px rgba(245,108,108,0.3); }
.title { font-weight:600; color:#555; margin-bottom:6px; }
.meta { color:#888; font-size:12px; display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.meta .dot { width:4px; height:4px; background:#bbb; border-radius:50%; display:inline-block; }
.value { font-size:22px; margin-bottom:6px; }
.value.warn { color:#f56c6c; }
.time { color:#999; font-size:12px; margin-bottom:6px; }
.status { margin-bottom:8px; }
.actions { text-align:right; }
.group { margin-bottom:16px; }
.group-title { font-weight:600; margin: 8px 0; color:#333; }
.empty-wrap { display:flex; align-items:center; justify-content:center; padding:12px 0; }
</style>
