<template>
  <div class="live-layout" @click="hideMenu">
    <aside class="left">
      <el-input
        v-model="store.query"
        placeholder="搜索摄像头/通道"
        size="small"
        clearable
        style="margin-bottom: 8px"
      />
      <el-tree
        :data="treeData"
        node-key="id"
        :props="{ label: 'label', children: 'children' }"
        highlight-current
        @node-click="onClickNode"
        @node-contextmenu="onCtxMenu"
        style="height: calc(100% - 40px); overflow: auto"
      >
        <template #default="{ data }">
          <span>
            <el-icon v-if="data.type==='device'" style="margin-right:4px"><i class="el-icon-video-camera" /></el-icon>
            <el-icon v-if="data.type==='channel'" style="margin-right:4px"><i class="el-icon-video-play" /></el-icon>
            <span>{{ data.label }}</span>
            <el-icon v-if="data.type==='channel' && store.isFavorite(data.id)" style="color:#f7ba2a;margin-left:6px"><i class="el-icon-star-on" /></el-icon>
          </span>
        </template>
      </el-tree>
      <div v-if="menu.visible" class="ctx-menu" :style="{ left: menu.x+'px', top: menu.y+'px' }" @click.stop>
        <div class="item" @click="actPreview">预览</div>
        <div class="item" @click="openPlayback">回放</div>
        <div class="item" @click="actDownload">下载</div>
        <div class="item" @click="actToggleFav">{{ store.isFavorite(menu.cameraId||'')? '取消常看' : '设为常看' }}</div>
      </div>
    </aside>
    <main class="right">
      <div class="grid" :style="gridStyle">
        <div v-for="i in gridIndexList" :key="i" class="tile" :class="{ selected: selectedSlot === i }" @click.stop="selectSlot(i)">
          <div v-if="store.selected[i]" class="player-wrap">
            <VideoPlayer :hls-url="store.sources[store.selected[i]]?.hlsUrl" :flv-url="store.sources[store.selected[i]]?.flvUrl" :title="titleFor(store.selected[i])" @net="(d:any) => onNet(i, d)" />
            <div class="tools">
              <span>{{ titleFor(store.selected[i]) }}</span>
              <el-button size="small" text @click="remove(store.selected[i])">移除</el-button>
            </div>
            <div v-if="showInfo" class="overlay-br">{{ titleFor(store.selected[i]) }} · {{ nowStr }}</div>
          </div>
          <div v-else class="empty">暂无视频</div>
        </div>
      </div>
      <div class="statusbar">
        通道总数：{{ store.cameras.length }}
        <span style="margin-left: 16px">在线：{{ onlineCount }}</span>
        <span style="margin-left: 16px">离线：{{ offlineCount }}</span>
        <div class="spacer"></div>
        <span>接收: {{ rxMbps.toFixed(3) }} Mbps</span>
        <span style="margin-left:12px">发送: {{ txMbps.toFixed(3) }} Mbps</span>
        <el-dropdown>
          <el-button size="small" type="primary" text>布局/叠加选项</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="setGrid(1)">单屏</el-dropdown-item>
              <el-dropdown-item @click="setGrid(4)">四分屏</el-dropdown-item>
              <el-dropdown-item @click="setGrid(9)">九分屏</el-dropdown-item>
              <el-dropdown-item @click="setGrid(16)">16分屏</el-dropdown-item>
              <el-dropdown-item @click="setGrid(25)">25分屏</el-dropdown-item>
              <el-dropdown-item @click="setGrid(36)">36分屏</el-dropdown-item>
              <el-dropdown-item divided @click="toggleInfo()">{{ showInfo ? '隐藏通道/时间' : '开启显示通道/时间' }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </main>
  </div>
  <el-dialog v-model="playback.visible" title="选择回放时间" width="420px">
    <el-form label-width="80px">
      <el-form-item label="开始时间">
        <el-date-picker v-model="playback.start" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>
      <el-form-item label="结束时间">
        <el-date-picker v-model="playback.end" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="playback.visible=false">取消</el-button>
      <el-button type="primary" @click="confirmPlayback">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useStreamsStore } from '../../stores/streams';
import VideoPlayer from '../../components/VideoPlayer.vue';

const store = useStreamsStore();
const COMPANY = '北京康比特体育科技股份有限公司';

const treeData = computed(() => {
  const favNodes = store.favorites
    .map((id) => store.cameras.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => ({ id: c.id, label: c.name, type: 'channel' }));
  const devices = new Map<string, Array<{ id: string; label: string; type: string }>>();
  for (const c of store.filtered) {
    const key = c.deviceSn || c.id.split('|')[0];
    if (!devices.has(key)) devices.set(key, []);
    devices.get(key)!.push({ id: c.id, label: c.name, type: 'channel' });
  }
  const deviceNodes = Array.from(devices.entries()).map(([dev, chans]) => ({ id: `dev:${dev}`, label: dev, type: 'device', children: chans }));
  const companyNode = { id: 'company', label: COMPANY, type: 'company', children: deviceNodes } as any;
  const root: any[] = [];
  if (favNodes.length) root.push({ id: 'favorites', label: '常看', type: 'group', children: favNodes });
  root.push(companyNode);
  return root;
});

function onClickNode(node: any) {
  if (node?.id && node.id !== 'root') {
    if (node.id.startsWith('dev:')) return; // device folder
    if (node.id === 'favorites' || node.id === 'company') return;
    // If a slot is selected, assign into that slot; otherwise auto-append to first empty slot
    const assign = async (slot: number) => {
      await store.loadSource(node.id, { autoSelect: false });
      // remove duplicates
      for (let k = 0; k < gridCount.value; k++) {
        if (store.selected[k] === node.id) store.selected[k] = undefined as any;
      }
      ensureSelectedLength(gridCount.value);
      store.selected[slot] = node.id as any;
    };
    if (selectedSlot.value !== null) {
      assign(selectedSlot.value);
      return;
    }
    // find first empty slot
    let empty = -1;
    for (let k = 0; k < gridCount.value; k++) { if (!store.selected[k]) { empty = k; break; } }
    assign(empty >= 0 ? empty : 0);
  }
}

function titleFor(cameraId?: string) {
  const cam = store.cameras.find((c) => c.id === cameraId);
  return cam?.name || cameraId || '';
}
function remove(id?: string) {
  if (id) store.removeSelected(id);
}

const onlineCount = computed(() => store.cameras.filter((c) => c.online).length);
const offlineCount = computed(() => store.cameras.filter((c) => !c.online).length);

onMounted(async () => {
  await store.fetchCameras(COMPANY);
});

// Context menu
const menu = reactive<{ visible: boolean; x: number; y: number; cameraId?: string }>({ visible: false, x: 0, y: 0, cameraId: undefined });
function onCtxMenu(_: MouseEvent, data: any) {
  if (!data || data.id?.startsWith('dev:') || data.id === 'favorites' || data.id === 'company') return;
  menu.visible = true;
  menu.x = _.clientX;
  menu.y = _.clientY;
  menu.cameraId = data.id;
}
function hideMenu() { menu.visible = false; }
function actPreview() { if (menu.cameraId) store.loadSource(menu.cameraId); hideMenu(); }
function actToggleFav() { if (menu.cameraId) store.toggleFavorite(menu.cameraId); hideMenu(); }

// Playback & download
import { streamsApi } from '../../api/streams';
// Lightweight date helpers to avoid external deps
function fmt(ts: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const y = ts.getFullYear();
  const m = p(ts.getMonth() + 1);
  const d = p(ts.getDate());
  const hh = p(ts.getHours());
  const mm = p(ts.getMinutes());
  const ss = p(ts.getSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
const playback = reactive<{ visible: boolean; start: string; end: string }>({ visible: false, start: '', end: '' });
function openPlayback() {
  if (!menu.cameraId) return;
  const end = new Date();
  const start = new Date(end.getTime() - 3600 * 1000);
  playback.start = fmt(start);
  playback.end = fmt(end);
  playback.visible = true;
}
async function confirmPlayback() {
  if (!menu.cameraId) return;
  const list = await streamsApi.back(menu.cameraId, playback.start, playback.end);
  const url = list[0];
  if (url) {
    // Load into a tile
    store.sources[menu.cameraId] = { cameraId: menu.cameraId, hlsUrl: url } as any;
    if (!store.selected.includes(menu.cameraId)) store.selected = [...store.selected, menu.cameraId].slice(-4);
  }
  playback.visible = false;
}
async function actDownload() {
  if (!menu.cameraId) return;
  const end = new Date();
  const start = new Date(end.getTime() - 3600 * 1000);
  const list = await streamsApi.download(menu.cameraId, fmt(start), fmt(end));
  const url = list[0];
  if (url) window.open(url, '_blank');
  hideMenu();
}

// Layout and overlays
const gridCount = ref(4);
function setGrid(n: number) { gridCount.value = n; }
const gridCols = computed(() => {
  const n = gridCount.value;
  if (n <= 1) return 1; if (n <= 4) return 2; if (n <= 9) return 3; if (n <= 16) return 4; if (n <= 25) return 5; return 6;
});
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${gridCols.value}, 1fr)` }));
const gridIndexList = computed(() => Array.from({ length: gridCount.value }, (_, i) => i));
const showInfo = ref(false);
function toggleInfo() { showInfo.value = !showInfo.value; }
const nowStr = ref('');
setInterval(() => { const d = new Date(); const p = (n:number)=>String(n).padStart(2,'0'); nowStr.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }, 1000);

// Net stats aggregate (simple latest sample)
const rxMbps = ref(0);
const txMbps = ref(0);
const rxMap = reactive<Record<number, number>>({});
const txMap = reactive<Record<number, number>>({});
function onNet(i: number, d: { rxMbps: number; txMbps: number }) {
  rxMap[i] = d.rxMbps || 0;
  txMap[i] = d.txMbps || 0;
  rxMbps.value = Object.values(rxMap).reduce((a, b) => a + (b || 0), 0);
  txMbps.value = Object.values(txMap).reduce((a, b) => a + (b || 0), 0);
}

// selected slot logic
const selectedSlot = ref<number | null>(null);
function selectSlot(i: number) { selectedSlot.value = i; }
function ensureSelectedLength(n: number) { for (let k = 0; k < n; k++) { if (store.selected[k] === undefined) store.selected[k] = undefined as any; } }
</script>

<style scoped>
.live-layout { display: grid; grid-template-columns: 280px 1fr; gap: 8px; height: calc(100vh - 160px); }
.left { background: #fff; border: 1px solid var(--el-border-color); padding: 8px; overflow: hidden; }
.right { display: flex; flex-direction: column; gap: 8px; }
.grid { flex: 1; display: grid; grid-auto-rows: minmax(200px, 1fr); gap: 8px; }
.tile { position: relative; border: 1px solid var(--el-border-color); background: #000; display: flex; align-items: center; justify-content: center; }
.tile.selected { border-color: var(--el-color-danger); box-shadow: 0 0 0 1px var(--el-color-danger) inset; }
.player-wrap { position: relative; width: 100%; height: 100%; }
.tools { position: absolute; left: 0; right: 0; top: 0; bottom: auto; background: rgba(0,0,0,.5); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; font-size: 12px; z-index: 2; }
.overlay-br { position: absolute; right: 6px; bottom: 6px; color: #fff; background: rgba(0,0,0,.35); padding: 2px 6px; font-size: 12px; border-radius: 2px; }
.empty { color: #999; background: #111; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.statusbar { height: 32px; background: #fff; border: 1px solid var(--el-border-color); display: flex; align-items: center; padding: 0 8px; }
.statusbar .spacer { flex: 1; }

.ctx-menu { position: fixed; z-index: 9999; background: #fff; border: 1px solid var(--el-border-color); box-shadow: 0 2px 8px rgba(0,0,0,.12); min-width: 120px; }
.ctx-menu .item { padding: 6px 12px; cursor: pointer; }
.ctx-menu .item:hover { background: var(--el-color-primary-light-9); }
</style>

 
