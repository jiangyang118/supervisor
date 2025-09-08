<template>
  <AvatarList
    :items="items"
    :name-key="nameKey"
    :meta-keys="metaKeys"
    :status-key="statusKey"
    :warn-values="warnValues"
  >
    <template #meta="{ item }">
      <span v-if="resolvedMetaLabel">{{ resolvedMetaLabel }}：{{ metaText(item) }}</span>
      <span v-else>{{ metaText(item) }}</span>
    </template>
  </AvatarList>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import AvatarList from './AvatarList.vue';

type AnyRec = Record<string, any>

const props = withDefaults(defineProps<{
  items: AnyRec[]
  nameKey?: string
  metaKeys?: string[]
  statusKey?: string
  warnValues?: Array<string | number | boolean>
  metaLabel?: string
}>(), {
  nameKey: 'name',
  metaKeys: () => ['temperature'],
  statusKey: 'status',
  warnValues: () => ['异常','到期','到期前3天'],
})

const { nameKey, metaKeys, statusKey, warnValues } = props
const resolvedMetaLabel = computed(() => props.metaLabel || (metaKeys.length === 1 && metaKeys[0] === 'temperature' ? '体温' : ''))
function metaText(it: AnyRec) {
  return metaKeys.map(k => String(it[k] ?? '')).filter(Boolean).join(' · ')
}
</script>
