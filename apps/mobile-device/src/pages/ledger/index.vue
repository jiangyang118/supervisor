<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">台账上报</text></view>
      <view class="list">
        <view class="list-item" v-for="c in cats" :key="c.key" @click="open(c.key)">
          <view>{{ c.name }}</view>
          <van-icon name="arrow" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const cats = [
  { key: 'sample', name: '留样' },
  { key: 'disinfection', name: '消毒' },
  { key: 'morning', name: '晨检' },
  { key: 'waste', name: '废弃物处理' },
  { key: 'accompany', name: '陪餐' },
  { key: 'hygiene', name: '卫生检查' },
  { key: 'additive', name: '食品添加剂' },
]

function open(key: string) {
  // 占位：跳往对应列表或创建表单
}
</script>

<style scoped>
</style>

