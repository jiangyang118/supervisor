<template>
  <svg v-if="k==='sun'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="10" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.08)"/>
    <g :stroke="stroke" :stroke-width="sw" stroke-linecap="round">
      <line x1="24" y1="2" x2="24" y2="10"/>
      <line x1="24" y1="38" x2="24" y2="46"/>
      <line x1="2" y1="24" x2="10" y2="24"/>
      <line x1="38" y1="24" x2="46" y2="24"/>
      <line x1="8" y1="8" x2="12" y2="12"/>
      <line x1="36" y1="36" x2="40" y2="40"/>
      <line x1="8" y1="40" x2="12" y2="36"/>
      <line x1="36" y1="12" x2="40" y2="8"/>
    </g>
  </svg>
  <svg v-else-if="k==='cloud'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <path d="M14 30a8 8 0 1 1 3.4-15.2A10 10 0 0 1 43 22a8 8 0 0 1-3 15H16a6 6 0 0 1-2-7z" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.06)"/>
  </svg>
  <svg v-else-if="k==='rain'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <path d="M14 26a8 8 0 1 1 3.4-15.2A10 10 0 0 1 43 18a8 8 0 0 1-3 15H16a6 6 0 0 1-2-7z" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.06)"/>
    <g :stroke="stroke" :stroke-width="sw" stroke-linecap="round">
      <line x1="18" y1="36" x2="16" y2="44"/>
      <line x1="26" y1="36" x2="24" y2="44"/>
      <line x1="34" y1="36" x2="32" y2="44"/>
    </g>
  </svg>
  <svg v-else-if="k==='storm'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <path d="M14 26a8 8 0 1 1 3.4-15.2A10 10 0 0 1 43 18a8 8 0 0 1-3 15H16a6 6 0 0 1-2-7z" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.06)"/>
    <path d="M22 34h6l-4 6h6l-8 8" :stroke="stroke" :stroke-width="sw" fill="none"/>
  </svg>
  <svg v-else-if="k==='snow'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <path d="M14 26a8 8 0 1 1 3.4-15.2A10 10 0 0 1 43 18a8 8 0 0 1-3 15H16a6 6 0 0 1-2-7z" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.06)"/>
    <g :stroke="stroke" :stroke-width="sw" stroke-linecap="round">
      <circle cx="20" cy="38" r="2" fill="currentColor"/>
      <circle cx="28" cy="40" r="2" fill="currentColor"/>
      <circle cx="36" cy="38" r="2" fill="currentColor"/>
    </g>
  </svg>
  <svg v-else-if="k==='fog'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <path d="M14 26a8 8 0 1 1 3.4-15.2A10 10 0 0 1 43 18a8 8 0 0 1-3 15H16a6 6 0 0 1-2-7z" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.06)"/>
    <g :stroke="stroke" :stroke-width="sw" stroke-linecap="round">
      <line x1="14" y1="36" x2="38" y2="36"/>
      <line x1="10" y1="40" x2="34" y2="40"/>
      <line x1="18" y1="44" x2="42" y2="44"/>
    </g>
  </svg>
  <svg v-else-if="k==='wind'" :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <g :stroke="stroke" :stroke-width="sw" stroke-linecap="round">
      <path d="M8 20h22a6 6 0 1 0-6-6"/>
      <path d="M6 28h26a6 6 0 1 1-6 6"/>
      <path d="M10 36h16"/>
    </g>
  </svg>
  <svg v-else :width="size" :height="size" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="10" :stroke="stroke" :stroke-width="sw" fill="rgba(17,197,255,.08)"/>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ kind?: string; size?: number; color?: string }>(), { kind: 'cloud', size: 18, color: 'var(--primary)' })
const k = computed(() => String(props.kind || 'cloud').toLowerCase())
const stroke = computed(() => props.color)
const sw = 2
const size = computed(() => props.size)
</script>

