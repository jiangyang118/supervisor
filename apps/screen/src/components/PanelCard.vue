<template>
  <div class="panel">
    <div class="panel-hd">
      <span class="title"><img src="../assets/img/title.png" />{{ title }}</span>
    </div>
    <div class="panel-bd"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; radius?: number }>();
</script>

<style scoped lang="less">
.panel {
  position: relative;
  overflow: hidden;
  background: #001b3d;
  box-shadow: inset 0px 0px 34px 0px #019cff;
  border: 2px solid #004a9e;
  padding: 10px 30px;
}
.panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px 4px;
  color: #ffffff;
  img {
    width: 20px;
    margin-right:10px;
  }
}
.panel-hd .title {
  font-weight: 700;
  letter-spacing: 0.5px;
}
.panel-bd {
  color: #e5f4ff;
  font-size: 13px;
}
</style>
