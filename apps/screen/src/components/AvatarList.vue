<template>
  <div class="list">
    <div
      v-for="(it, i) in items"
      :key="keyOf(it, i)"
      class="row"
      :class="{ abn: isWarn(it) }"
    >
      <!-- <div class="avatar">{{ avatarText(it).slice(0, 1) }}</div> -->
      <div class="info">
        <div class="name">{{ titleOf(it) }}</div>
        <div class="meta">
          <slot name="meta" :item="it">
            {{ metaOf(it) }}
          </slot>
        </div>
      </div>
      <div class="right">
        <slot name="right" :item="it">
          <span v-if="statusKey" class="status" :class="isWarn(it) ? 'warn' : 'ok'">
            {{ String(it[statusKey]) }}
          </span>
        </slot>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

type AnyRec = Record<string, any>

const props = withDefaults(defineProps<{
  items: AnyRec[]
  nameKey?: string
  metaKeys?: string[]
  statusKey?: string
  okValues?: Array<string | number | boolean>
  warnValues?: Array<string | number | boolean>
  itemKey?: (item: AnyRec, index: number) => string | number
  avatarKey?: string
}>(), {
  nameKey: 'name',
  metaKeys: () => [],
  okValues: () => ['正常', 'ok', '合格', false, 0],
  warnValues: () => ['异常', 'warn', '不合格', true, 1],
})

function keyOf(it: AnyRec, i: number) {
  return props.itemKey ? props.itemKey(it, i) : (it.id ?? it[props.nameKey] ?? i)
}
function titleOf(it: AnyRec) {
  return String(it[props.nameKey] ?? '')
}
function avatarText(it: AnyRec) {
  const k = props.avatarKey || props.nameKey
  return String(it[k] ?? '')
}
function metaOf(it: AnyRec) {
  if (!props.metaKeys?.length) return ''
  return props.metaKeys.map(k => String(it[k] ?? '')).filter(Boolean).join(' · ')
}
const isWarn = (it: AnyRec) => {
  if (!props.statusKey) return false
  const val = it[props.statusKey]
  return props.warnValues.some(v => String(v) === String(val))
}
</script>
<style scoped>
.row { display:flex; align-items:center; gap:10px; padding:6px 8px; border:1px solid rgba(17,197,255,.12); border-radius:8px; margin:6px 0; background: rgba(255,255,255,.02); }
.row.abn { border-color: rgba(255,120,120,.25); box-shadow: inset 0 0 18px rgba(255,120,120,.06); }
.avatar { width:32px; height:32px; border-radius:999px; background:#0a1a2a; border:1px solid rgba(17,197,255,.25); display:flex; align-items:center; justify-content:center; color:#cde7ff; font-weight:700 }
.info { flex:1; min-width: 0; }
.name { color:#e5f4ff; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.meta { color:#9dccff; font-size:12px }
.right { display:flex; align-items:center; }
.status { font-size:12px; padding:2px 8px; border-radius:999px; border:1px solid rgba(17,197,255,.2); }
.status.ok { color:#86f7c8; border-color: rgba(134,247,200,.3); }
.status.warn { color:#ff9a9a; border-color: rgba(255,154,154,.35); }
</style>

