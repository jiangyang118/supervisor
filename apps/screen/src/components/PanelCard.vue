<template>
  <div class="panel">
    <div class="panel-hd">
      <span class="title">{{ title }}</span>
    </div>
    <div class="panel-bd"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; radius?: number }>()
</script>

<style scoped>
.panel {
  position: relative;
  overflow: hidden;
  background: #001B3D;
  box-shadow: inset 0px 0px 34px 0px #019CFF;
  border: 2px solid #004A9E;
  padding:10px 30px;
}
.panel-hd { display:flex; align-items:center; justify-content:space-between; padding: 0 4px 8px 4px; color:#ffffff; }
.panel-hd .title { font-weight: 700; letter-spacing: .5px; }
.panel-bd { color: #e5f4ff; font-size: 13px; }
</style>
