<template>
  <div class="num">
    <div class="k">{{ label }}</div>
    <div class="v">{{ value }}</div>
  </div>
  
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number | string }>()
</script>

