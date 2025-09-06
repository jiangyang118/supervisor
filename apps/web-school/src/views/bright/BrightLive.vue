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
      <div class="grid">
        <div v-for="(slotId, idx) in 4" :key="idx" class="tile">
          <div v-if="store.selected[idx]" class="player-wrap">
            <VideoPlayer :hls-url="store.sources[store.selected[idx]]?.hlsUrl" :flv-url="store.sources[store.selected[idx]]?.flvUrl" :title="titleFor(store.selected[idx])" />
            <div class="tools">
              <span>{{ titleFor(store.selected[idx]) }}</span>
              <el-button size="small" text @click="remove(store.selected[idx])">移除</el-button>
            </div>
          </div>
          <div v-else class="empty">暂无视频</div>
        </div>
      </div>
      <div class="statusbar">
        通道总数：{{ store.cameras.length }}
        <span style="margin-left: 16px">在线：{{ onlineCount }}</span>
        <span style="margin-left: 16px">离线：{{ offlineCount }}</span>
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
import { computed, onMounted, reactive } from 'vue';
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
    store.loadSource(node.id);
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
import dayjs from 'dayjs';
const playback = reactive<{ visible: boolean; start: string; end: string }>({ visible: false, start: '', end: '' });
function openPlayback() {
  if (!menu.cameraId) return;
  const end = dayjs();
  const start = end.subtract(1, 'hour');
  playback.start = start.format('YYYY-MM-DD HH:mm:ss');
  playback.end = end.format('YYYY-MM-DD HH:mm:ss');
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
  const end = dayjs();
  const start = end.subtract(1, 'hour');
  const list = await streamsApi.download(menu.cameraId, start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss'));
  const url = list[0];
  if (url) window.open(url, '_blank');
  hideMenu();
}
</script>

<style scoped>
.live-layout { display: grid; grid-template-columns: 280px 1fr; gap: 8px; height: calc(100vh - 160px); }
.left { background: #fff; border: 1px solid var(--el-border-color); padding: 8px; overflow: hidden; }
.right { display: flex; flex-direction: column; gap: 8px; }
.grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(200px, 1fr); gap: 8px; }
.tile { position: relative; border: 1px solid var(--el-border-color); background: #000; display: flex; align-items: center; justify-content: center; }
.player-wrap { position: relative; width: 100%; height: 100%; }
.tools { position: absolute; left: 0; right: 0; top: 0; bottom: auto; background: rgba(0,0,0,.5); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; font-size: 12px; z-index: 2; }
.empty { color: #999; background: #111; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.statusbar { height: 32px; background: #fff; border: 1px solid var(--el-border-color); display: flex; align-items: center; padding: 0 8px; }

.ctx-menu { position: fixed; z-index: 9999; background: #fff; border: 1px solid var(--el-border-color); box-shadow: 0 2px 8px rgba(0,0,0,.12); min-width: 120px; }
.ctx-menu .item { padding: 6px 12px; cursor: pointer; }
.ctx-menu .item:hover { background: var(--el-color-primary-light-9); }
</style>

 
