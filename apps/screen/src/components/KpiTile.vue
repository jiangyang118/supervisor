<template>
  <div class="kpi" :class="{ warn }">
    <div class="name">{{ name }}</div>
    <div class="val">
      {{ value }}<span class="unit" v-if="unit">{{ unit }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">

defineProps<{ name: string; value: number | string; unit?: string; warn?: boolean }>();
</script>
<style scoped>
.kpi {
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}
.kpi.warn {
  border-color: rgba(255, 120, 120, 0.4);
  box-shadow: inset 0 0 20px rgba(255, 120, 120, 0.06);
}
.name {
  color: #ffffff;
  font-size: 12px;
  background: url('../assets/img/morningCheckTitle.png') no-repeat;
  background-size: 100% 100%;
  width: 100%;
  padding:10px 0;

}
.val {
  color: #66C5FF;
  font-weight: 800;
  font-size: 26px;
  letter-spacing: 0.5px;
  background: url('../assets/img/morningCheckConent.png') no-repeat;
  background-size: 100% 100%;
  width: 100%;
  padding:24px 0;

}
.unit {
  font-size: 12px;
  margin-left: 6px;
  color: #9dccff;
  font-weight: 400;
}
</style>
