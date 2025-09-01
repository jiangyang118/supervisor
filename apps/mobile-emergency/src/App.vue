<script setup lang="ts"></script>

<template>
  <div style="min-height:100vh; padding-bottom: 56px; box-sizing: border-box; background:#f7f8fa;">
    <router-view />
  </div>
  <van-tabbar route fixed safe-area-inset-bottom active-color="#6C5CE7" inactive-color="#595959">
    <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item to="/schools" icon="records">档案</van-tabbar-item>
    <van-tabbar-item to="/monitor" icon="video-o">监控</van-tabbar-item>
    <van-tabbar-item to="/alerts" icon="warning-o">预警</van-tabbar-item>
    <van-tabbar-item to="/tasks" icon="todo-list-o">任务</van-tabbar-item>
  </van-tabbar>
</template>

<style>
/* global shell only */
</style>
