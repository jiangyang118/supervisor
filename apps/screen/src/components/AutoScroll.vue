<template>
  <div ref="box" class="auto-scroll" :style="boxStyle" @mouseenter="onEnter" @mouseleave="onLeave">
    <div class="content">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
const props = withDefaults(defineProps<{ height?: number; step?: number; interval?: number; pauseOnHover?: boolean; auto?: boolean }>(), {
  height: 220,
  step: 1,
  interval: 30,
  pauseOnHover: true,
  auto: true,
})
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
const boxStyle = computed(() => ({ maxHeight: props.height + 'px', overflowY: 'auto' }))
</script>
<style scoped>
.auto-scroll { scrollbar-width: thin; scrollbar-color: rgba(17,197,255,.25) transparent; }
.auto-scroll::-webkit-scrollbar { width: 6px; }
.auto-scroll::-webkit-scrollbar-thumb { background: rgba(17,197,255,.25); border-radius: 999px; }
.content { padding-right: 4px; }
</style>

