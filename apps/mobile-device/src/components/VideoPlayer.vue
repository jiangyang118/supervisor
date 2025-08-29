<template>
  <view class="video-box">
    <video
      v-if="hlsUrl"
      :src="hlsUrl"
      webkit-playsinline
      playsinline
      controls
      :muted="muted"
      :autoplay="autoplay"
      style="width:100%;height:200px;border-radius:8px;background:#000"
    />
    <image v-else :src="snapshotWithTs" mode="aspectFill" style="width:100%;height:200px;border-radius:8px;" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ hlsUrl?: string; snapshot?: string; autoplay?: boolean; muted?: boolean }>(), {
  autoplay: true,
  muted: true,
})

const snapshotWithTs = computed(() => {
  if (!props.snapshot) return ''
  const u = new URL(props.snapshot, location.origin)
  u.searchParams.set('t', String(Date.now()))
  return u.toString()
})
</script>

<style scoped>
.video-box { background: #000; border-radius: 8px; overflow: hidden; }
</style>

