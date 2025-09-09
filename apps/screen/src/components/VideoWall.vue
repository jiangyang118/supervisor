<template>
  <div class="wall" :style="gridStyle">
    <div v-for="(v,i) in displayVideos" :key="i" class="cell">
      <template v-if="v.src">
        <div class="video-wrap">
          <video v-if="useNative(v.src)" :src="v.src" :poster="v.poster" muted autoplay loop playsinline></video>
          <div v-else ref="setFlvRef(i)" class="flv-holder">
            <div class="title">{{ v.title || '通道' }}</div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="poster">
          <img :src="v.poster" alt="poster" />
          <div class="title">{{ v.title || '通道' }}</div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
type VideoItem = { title: string; poster?: string; src?: string; type?: 'auto'|'flv'|'mp4' }
const props = defineProps<{ videos: Array<VideoItem>; grid?: number; rotate?: boolean; interval?: number }>()

const gridStyle = computed(() => {
  const g = props.grid && props.grid >= 1 ? props.grid : 4
  return {
    display: 'grid', gap:'6px',
    gridTemplateColumns: g===1? '1fr' : g===4? '1fr 1fr' : '1fr 1fr 1fr',
    gridTemplateRows: g===1? '1fr' : g===4? '1fr 1fr' : '1fr 1fr 1fr',
  } as any
})

const start = ref(0)
const displayVideos = computed(() => {
  const g = props.grid && props.grid >= 1 ? props.grid : 4
  if (!props.videos || props.videos.length === 0) return []
  if (!props.rotate) return props.videos.slice(0, g)
  const arr: VideoItem[] = []
  for (let i=0;i<g;i++) arr.push(props.videos[(start.value + i) % props.videos.length])
  return arr
})

let timer: any
onMounted(() => {
  if (props.rotate && (props.videos?.length || 0) > (props.grid || 4)) {
    const iv = Math.max(3_000, props.interval || 6_000)
    timer = setInterval(() => { start.value = (start.value + (props.grid || 4)) % props.videos.length }, iv)
  }
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

function useNative(src?: string) {
  if (!src) return false
  const s = src.toLowerCase()
  return s.endsWith('.mp4') || s.endsWith('.webm') || s.startsWith('blob:')
}

// Optional flv.js support if available and src ends with .flv
const flvHolders = ref<HTMLElement[]>([])
function setFlvRef(i: number) {
  return (el: HTMLElement | null) => { if (el) flvHolders.value[i] = el }
}
watch(displayVideos, async (list) => {
  // try dynamic import only when needed
  const toInit = list.filter((v) => v.src && v.src.toLowerCase().endsWith('.flv'))
  if (!toInit.length) return
  let flv: any = null
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    flv = (await import('flv.js')).default
  } catch { /* ignore */ }
  if (!flv || !flv.isSupported?.()) return
  toInit.forEach((v, i) => {
    const holder = flvHolders.value[i]
    if (!holder) return
    holder.innerHTML = ''
    const video = document.createElement('video')
    video.setAttribute('muted', 'true')
    video.setAttribute('autoplay', 'true')
    video.setAttribute('playsinline', 'true')
    video.setAttribute('controls', 'false')
    video.style.width = '100%'
    video.style.height = '100%'
    video.poster = v.poster || ''
    holder.appendChild(video)
    try {
      const player = flv.createPlayer({ type: 'flv', url: v.src }, { isLive: true, enableWorker: true })
      player.attachMediaElement(video)
      player.load()
      player.play()
    } catch { /* ignore init errors */ }
  })
}, { immediate: true })
</script>
<style scoped>
.cell { background:#0a1a2a; border:1px solid rgba(17,197,255,.2); border-radius:8px; overflow:hidden; position:relative; }
.poster { height: 140px; display:flex; align-items:center; justify-content:center; }
.poster img { width:100%; height:100%; object-fit: cover; filter: brightness(.85); }
.video-wrap, .flv-holder { height: 140px; background: #000; position: relative; }
.video-wrap video { width:100%; height:100%; object-fit: cover; }
.title { position:absolute; left:8px; bottom:8px; font-size:12px; color:#cde7ff; background: rgba(0,0,0,.35); padding:2px 6px; border-radius:999px; }
</style>
