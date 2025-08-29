<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">食安资讯</text></view>
      <view class="list">
        <view class="list-item" v-for="n in list" :key="n.id">
          <view>
            <view style="font-weight:600">{{ n.title }}</view>
            <view class="muted">{{ n.date }}</view>
          </view>
          <van-button size="small" plain>阅读</van-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const list = [
  { id: 'n1', title: '校园食品安全管理要点', date: '2025-08-28' },
  { id: 'n2', title: '餐厨废弃物规范处理', date: '2025-08-27' },
]
</script>

<style scoped>
</style>

