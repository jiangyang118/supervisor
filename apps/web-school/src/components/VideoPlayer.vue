<template>
  <div ref="wrap" class="player">
    <video ref="videoEl" class="video" controls muted playsinline></video>
    <div v-if="!isReady" class="placeholder">{{ title || '加载中…' }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{ hlsUrl?: string; title?: string }>();
const videoEl = ref<HTMLVideoElement | null>(null);
let hls: any = null;
const isReady = ref(false);

function destroy() {
  try {
    if (hls) {
      hls.destroy?.();
      hls = null;
    }
  } catch {}
  isReady.value = false;
}

async function play() {
  destroy();
  const el = videoEl.value!;
  if (props.hlsUrl) {
    try {
      const mod = await import('hls.js');
      const Hls = mod.default || (mod as any);
      if (Hls?.isSupported?.()) {
        hls = new Hls({ liveDurationInfinity: true });
        hls.loadSource(props.hlsUrl);
        hls.attachMedia(el);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          el.play().catch(() => {});
          isReady.value = true;
        });
        return;
      }
    } catch {}
    // Safari 原生 HLS 回退
    el.src = props.hlsUrl;
    await el.play().catch(() => {});
    isReady.value = true;
    return;
  }
  isReady.value = false;
}

watch(
  () => props.hlsUrl,
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
