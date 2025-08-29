<template>
  <div class="grid-3">
    <button
      v-for="it in items"
      :key="it.to"
      class="quick-tile shadow-hover"
      @click="$router.push(it.to)"
    >
      <van-icon :name="it.icon || 'apps-o'" />
      <span class="label">{{ it.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
export type QuickItem = { label: string; to: string; icon?: string }
defineProps<{ items: QuickItem[] }>()
</script>

<style scoped lang="less">
.quick-tile {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: 6px; padding: 14px 8px; width: 100%; border: none; background: #fff; cursor: pointer;
  .rounded(@radius-md);
  border: 1px solid fade(@brand-primary, 14%);
}
.quick-tile .van-icon { font-size: 22px; color: @brand-primary; }
.quick-tile .label { font-size: 13px; color: var(--text-primary); }
</style>

