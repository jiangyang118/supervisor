<script setup lang="ts">
import { useRoute } from 'vue-router'
import './styles/theme.css'
const route = useRoute()
</script>

<template>
  <div class="bg-decor"></div>
  <view style="min-height:100vh; padding-bottom: 60px; box-sizing: border-box;">
    <router-view />
  </view>
  <van-tabbar route fixed safe-area-inset-bottom active-color="#6C5CE7" inactive-color="#595959">
    <van-tabbar-item to="/dashboard" icon="home-o">总览</van-tabbar-item>
    <van-tabbar-item to="/todo" icon="todo-list-o">工作</van-tabbar-item>
    <van-tabbar-item to="/ledger" icon="notes-o">台账</van-tabbar-item>
    <van-tabbar-item to="/warn" icon="warning-o">预警</van-tabbar-item>
    <van-tabbar-item to="/mine" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<style>
/* global styles imported above */
</style>
