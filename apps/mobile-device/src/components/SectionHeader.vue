<template>
  <div class="section-heading">
    <div class="label">
      <slot />
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.actions { display: inline-flex; gap: 8px; align-items: center; }
</style>

