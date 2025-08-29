<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">监督检查结果</text></view>
      <view class="list">
        <view class="list-item" v-for="i in items" :key="i.id">
          <view>
            <view style="font-weight:600">{{ i.title }}</view>
            <view class="muted">不合格项：{{ i.failItems.join('、') }}</view>
          </view>
          <van-button size="small" type="primary" plain>整改</van-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const items = [
  { id: 'in1', title: '9月例行检查', failItems: ['台账漏项', '清洁不到位'] },
  { id: 'in2', title: '抽检', failItems: ['原料票据不全'] },
]
</script>

<style scoped>
</style>

