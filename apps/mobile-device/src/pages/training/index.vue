<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">培训考试</text></view>
      <view class="list">
        <view class="list-item" v-for="c in courses" :key="c.id">
          <view>
            <view style="font-weight:600">{{ c.title }}</view>
            <view class="muted">{{ c.duration }} 分钟</view>
          </view>
          <van-button size="small" type="primary">学习</van-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const courses = [
  { id: 'c1', title: '食品安全基础', duration: 45 },
  { id: 'c2', title: '操作间规范', duration: 30 },
]
</script>

<style scoped>
</style>

