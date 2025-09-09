<template>
  <div class="sensor" :class="{ abnormal: isAbnormal }">
    <div class="name">{{ name }}</div>
    <div class="val">{{ value }}<span class="unit">{{ unit }}</span></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ name: string; value: number|string; unit: string; abnormal?: boolean; warnAbove?: number; warnBelow?: number }>()
const numVal = computed(() => typeof props.value === 'number' ? props.value : parseFloat(String(props.value)))
const isAbnormal = computed(() => {
  if (props.abnormal === true) return true
  if (!Number.isFinite(numVal.value)) return false
  if (typeof props.warnAbove === 'number' && numVal.value > props.warnAbove) return true
  if (typeof props.warnBelow === 'number' && numVal.value < props.warnBelow) return true
  return false
})
</script>
<style scoped>
.sensor { border:1px solid rgba(17,197,255,.2); border-radius:8px; padding:10px; background: rgba(255,255,255,.02); transition: border-color .2s ease, box-shadow .2s ease; }
.sensor.abnormal { border-color: rgba(255,120,120,.65); box-shadow: inset 0 0 20px rgba(255,120,120,.12), 0 0 0 rgba(255,120,120,.0); animation: blinkGlow 1.2s infinite ease-in-out; }
.name { color:#9dccff; font-size:12px; }
.val { color:#e9f7ff; font-weight:800; font-size:22px; letter-spacing:.5px; }
.unit { font-size:12px; color:#9dccff; margin-left:4px; }
@keyframes blinkGlow {
  0% { box-shadow: inset 0 0 16px rgba(255,120,120,.10), 0 0 0 rgba(255,120,120,0); }
  50% { box-shadow: inset 0 0 28px rgba(255,120,120,.22), 0 0 16px rgba(255,120,120,.25); }
  100% { box-shadow: inset 0 0 16px rgba(255,120,120,.10), 0 0 0 rgba(255,120,120,0); }
}
</style>
