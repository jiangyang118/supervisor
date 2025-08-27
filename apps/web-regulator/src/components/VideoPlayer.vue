<template>
  <div ref="wrap" class="player">
    <video ref="videoEl" class="video" controls muted playsinline></video>
    <div v-if="!isReady" class="placeholder">{{ title || '加载中…' }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import flvjs from 'flv.js';
import Hls from 'hls.js';

const props = defineProps<{ flvUrl?: string; hlsUrl?: string; title?: string }>();
const videoEl = ref<HTMLVideoElement | null>(null);
let flv: flvjs.Player | null = null;
let hls: Hls | null = null;
const isReady = ref(false);

function destroy() {
  try {
    if (flv) {
      flv.unload();
      flv.detachMediaElement();
      flv.destroy();
      flv = null;
    }
  } catch (e) {
    /* noop */
  }
  try {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  } catch (e) {
    /* noop */
  }
  isReady.value = false;
}

async function play() {
  destroy();
  const el = videoEl.value!;
  if (props.flvUrl && flvjs.isSupported()) {
    flv = flvjs.createPlayer({ type: 'flv', url: props.flvUrl, isLive: true, hasAudio: false });
    flv.attachMediaElement(el);
    flv.load();
    await el.play().catch(() => {});
    isReady.value = true;
    return;
  }
  if (props.hlsUrl) {
    if (Hls.isSupported()) {
      hls = new Hls({ liveDurationInfinity: true });
      hls.loadSource(props.hlsUrl);
      hls.attachMedia(el);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        el.play().catch(() => {});
        isReady.value = true;
      });
      return;
    }
    // Safari 原生 HLS
    el.src = props.hlsUrl;
    await el.play().catch(() => {});
    isReady.value = true;
    return;
  }
  isReady.value = false;
}

watch(
  () => [props.flvUrl, props.hlsUrl],
  () => play(),
);
onMounted(() => {
  if (videoEl.value) play();
});
onUnmounted(() => destroy());
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
</style>
