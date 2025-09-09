<template>
  <div class="fb">
    <div v-for="f in items" :key="f.name+f.phone" class="row">
      <div class="avatar hairline">{{ f.name.slice(0,1) }}</div>
      <div class="info">
        <div class="name">{{ f.name }} · {{ f.role }}</div>
        <div class="phone">{{ f.phone }}</div>
      </div>
      <div class="qr hairline" :style="qrStyle"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
defineProps<{ items: Array<{ name: string; role: string; phone: string }> }>()
// lightweight QR-like placeholder using CSS gradients
const qrStyle = computed(() => ({
  background: `
    repeating-linear-gradient(90deg, rgba(205,231,255,.15) 0 4px, transparent 4px 8px),
    repeating-linear-gradient(0deg, rgba(205,231,255,.15) 0 4px, transparent 4px 8px),
    radial-gradient(circle at 30% 30%, rgba(17,197,255,.2), transparent 40%),
    #061423
  `
}))
</script>
<style scoped>
.row { display:flex; align-items:center; gap:10px; margin:8px 0; }
.avatar { width:34px; height:34px; border-radius:999px; background:#0a1a2a; border:1px solid rgba(17,197,255,.25); display:flex; align-items:center; justify-content:center; color:#cde7ff; font-weight:700 }
.info { flex:1; }
.name { color:#e5f4ff; font-size:13px }
.phone { color:#9dccff; font-size:12px }
.qr { width:38px; height:38px; border:1px dashed rgba(17,197,255,.25); border-radius:4px; }
</style>
