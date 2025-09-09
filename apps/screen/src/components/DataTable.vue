<template>
  <div ref="box" class="tbl-wrap" :style="wrapStyle" @mouseenter="onEnter" @mouseleave="onLeave">
  <table class="tbl">
    <thead>
      <tr>
        <th v-for="c in columns" :key="c.prop" :style="w(c.width)">{{ c.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(r,i) in rows" :key="i">
        <td v-for="c in columns" :key="c.prop" :style="w(c.width)">{{ r[c.prop] }}</td>
      </tr>
    </tbody>
  </table>
  <div v-if="!rows || rows.length===0" class="empty">暂无数据</div>
  </div>
</template>
<script setup lang="ts">
export type Column = { prop: string; label: string; width?: string|number }
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
const props = withDefaults(defineProps<{ columns: Column[]; rows: any[]; height?: number; auto?: boolean; step?: number; interval?: number; pauseOnHover?: boolean }>(), {
  height: 240,
  auto: true,
  step: 1,
  interval: 30,
  pauseOnHover: true,
})
function w(val?: string|number) {
  return val ? { width: typeof val==='number'? `${val}px` : String(val) } : {}
}
const box = ref<HTMLDivElement>()
let timer: any
function tick() {
  const el = box.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return
  if (el.scrollTop >= max) el.scrollTop = 0
  else el.scrollTop += props.step
}
function start() { if (props.auto) stop(); if (props.auto) timer = setInterval(tick, props.interval) }
function stop() { if (timer) clearInterval(timer); timer = null }
function onEnter() { if (props.pauseOnHover) stop() }
function onLeave() { if (props.pauseOnHover) start() }
onMounted(start)
onBeforeUnmount(stop)
const wrapStyle = computed(() => ({ maxHeight: props.height + 'px', overflowY: 'auto' }))
</script>
<style scoped>
.tbl-wrap { scrollbar-width: thin; scrollbar-color: rgba(17,197,255,.25) transparent; }
.tbl-wrap::-webkit-scrollbar { width: 6px; }
.tbl-wrap::-webkit-scrollbar-thumb { background: rgba(17,197,255,.25); border-radius: 999px; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl thead th { text-align: left; padding: 6px 8px; color:#9dccff; font-size:12px; border-bottom:1px solid rgba(17,197,255,.2); }
.tbl tbody td { padding: 8px; color:#e5f4ff; font-size:13px; border-bottom:1px dashed rgba(17,197,255,.12) }
.empty { color:#9dccff; font-size:12px; padding:6px }
</style>
