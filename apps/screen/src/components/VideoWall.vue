<template>
  <div class="grid-2" :style="wrapStyle">
    <div v-for="(cell, i) in gridCount" :key="i" class="video-cell">
      <div class="label">{{ titles[i] || `通道 ${i+1}` }}</div>
      <!-- 占位视频，预留 HLS/webrtc 接入接口 -->
      <video :src="''" style="width:100%;height:100%;object-fit:cover;background:#020b14" muted autoplay loop playsinline></video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ grid?: 1|4|9; titles?: string[] }>(), { grid: 4, titles: () => [] })

const gridCount = computed(() => props.grid)
const wrapStyle = computed(() => ({
  gridTemplateColumns: props.grid === 1 ? '1fr' : props.grid === 4 ? '1fr 1fr' : '1fr 1fr 1fr',
  gridTemplateRows: props.grid === 1 ? '320px' : props.grid === 4 ? '200px 200px' : '140px 140px 140px'
}))
</script>

