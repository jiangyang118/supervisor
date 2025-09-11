<template>
  <div ref="wrap" class="player">
    <video ref="videoEl" class="video" playsinline></video>
    <div v-if="!isReady" class="placeholder">{{ title || '加载中…' }}</div>
    <div class="bar">
      <span class="name">{{ title }}</span>
      <div class="spacer" />
      <el-button  text @click="togglePlay">{{ isPlaying ? '暂停' : '播放' }}</el-button>
      <el-button  text @click="toggleMute">{{ muted ? '静音开' : '静音关' }}</el-button>
      <el-button  text @click="snapshot">截图</el-button>
      <el-button  text @click="fullscreen">全屏</el-button>
      <el-button
        v-if="canSwitch"
        
        text
        @click="switchMode"
      >切换为 {{ mode === 'hls' ? 'FLV' : 'HLS' }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';

const props = defineProps<{ hlsUrl?: string; flvUrl?: string; title?: string }>();
const emit = defineEmits<{ (e: 'net', d: { rxMbps: number; txMbps: number }): void }>();
const videoEl = ref<HTMLVideoElement | null>(null);
let hls: any = null;
let flv: any = null;
const isReady = ref(false);
const isPlaying = ref(false);
const muted = ref(true);
const mode = ref<'hls' | 'flv'>('hls');

const canSwitch = computed(() => !!props.hlsUrl && !!props.flvUrl);

function destroy() {
  try {
    if (hls) {
      hls.destroy?.();
      hls = null;
    }
    if (flv) {
      try { flv.unload?.(); flv.detachMediaElement?.(); flv.destroy?.(); } catch {}
      flv = null;
    }
  } catch {}
  isReady.value = false;
  isPlaying.value = false;
}

async function play() {
  destroy();
  const el = videoEl.value!;
  el.muted = muted.value;
  const tryHls = async () => {
    if (!props.hlsUrl) return false;
    try {
      const mod = await import('hls.js');
      const Hls = (mod as any).default || (mod as any);
      if (Hls?.isSupported?.()) {
        hls = new Hls({ liveDurationInfinity: true });
        // collect network stats from hls
        let rxBytes = 0;
        hls.on(Hls.Events.FRAG_LOADED, (_e: any, data: any) => {
          const b = (data?.stats?.total ?? data?.stats?.loaded ?? 0) as number;
          if (b > 0) rxBytes += b;
        });
        hls.loadSource(props.hlsUrl);
        hls.attachMedia(el);
        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          await el.play().catch(() => {});
          isReady.value = true;
          isPlaying.value = true;
        });
        // emit Mbps every second
        const t = setInterval(() => {
          const mbps = (rxBytes * 8) / 1_000_000;
          emit('net', { rxMbps: mbps, txMbps: 0 });
          rxBytes = 0;
        }, 1000);
        (t as any).unref?.();
        return true;
      }
    } catch {}
    // Safari 原生 HLS 回退
    try {
      el.src = props.hlsUrl!;
      await el.play();
      isReady.value = true;
      isPlaying.value = true;
      return true;
    } catch { return false; }
  };
  const tryFlv = async () => {
    if (!props.flvUrl) return false;
    try {
      const mod = await import('flv.js');
      const flvjs = (mod as any).default || (mod as any);
      if (flvjs?.isSupported?.()) {
        flv = flvjs.createPlayer({ type: 'flv', url: props.flvUrl, isLive: true, cors: true });
        flv.attachMediaElement(el);
        // stats from flv.js
        let latestKbps = 0;
        try {
          flv.on('statistics_info', (info: any) => {
            // info.speed in KB/s (approx); convert to Mbps
            if (info && typeof info.speed === 'number') {
              latestKbps = info.speed * 8 / 1000; // KB/s -> Mb/s approx
            }
          });
          const t = setInterval(() => {
            emit('net', { rxMbps: latestKbps, txMbps: 0 });
          }, 1000);
          (t as any).unref?.();
        } catch {}
        flv.load();
        await el.play().catch(() => {});
        isReady.value = true;
        isPlaying.value = true;
        return true;
      }
    } catch { return false; }
    return false;
  };

  const want = mode.value;
  let ok = false;
  if (want === 'hls') ok = await tryHls();
  if (!ok) ok = await tryFlv();
  if (!ok && want === 'flv') ok = await tryHls();
  isReady.value = ok;
}

watch(
  () => [props.hlsUrl, props.flvUrl, mode.value],
  () => play(),
);
onMounted(() => {
  if (videoEl.value) play();
});
onUnmounted(() => destroy());

function togglePlay() {
  const el = videoEl.value!;
  if (isPlaying.value) { el.pause(); isPlaying.value = false; }
  else { el.play().catch(() => {}); isPlaying.value = true; }
}
function toggleMute() {
  muted.value = !muted.value;
  if (videoEl.value) videoEl.value.muted = muted.value;
}
function snapshot() {
  const el = videoEl.value!;
  if (!el) return;
  const canvas = document.createElement('canvas');
  canvas.width = el.videoWidth || 1280;
  canvas.height = el.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.title || 'snapshot'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
function fullscreen() {
  const wrap = (document as any).fullscreenElement ? null : (document as any).activeElement;
  const el = (wrap && wrap.closest) ? (wrap.closest('.player') as any) : (videoEl.value?.parentElement as any);
  const target: any = el || videoEl.value;
  if (!target) return;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    target.requestFullscreen?.();
  }
}
function switchMode() {
  mode.value = mode.value === 'hls' ? 'flv' : 'hls';
}
</script>

<style scoped>
.player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}
.video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}
.bar { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 4px 6px; gap: 6px; background: rgba(0,0,0,.45); color: #fff; z-index: 3; }
.bar .name { font-size: 12px; opacity: .9; }
.bar .spacer { flex: 1; }
</style>
