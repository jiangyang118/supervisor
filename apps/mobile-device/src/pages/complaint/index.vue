<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">公众投诉</text></view>
      <view class="list">
        <view class="list-item" v-for="c in list" :key="c.id">
          <view>
            <view style="font-weight:600">{{ c.title }}</view>
            <view class="muted">{{ c.status }} · {{ c.time }}</view>
          </view>
          <van-button size="small">查看</van-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const list = [
  { id: 'cp1', title: '饭菜有异物', status: '处理中', time: '09:21' },
  { id: 'cp2', title: '打饭排队太慢', status: '已反馈', time: '08:10' },
]
</script>

<style scoped>
</style>

