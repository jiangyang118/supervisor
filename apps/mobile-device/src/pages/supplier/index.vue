<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">供应商</text><van-button size="small" type="primary">新增</van-button></view>
      <view class="list">
        <view class="list-item" v-for="s in list" :key="s.id">
          <view>
            <view style="font-weight:600">{{ s.name }}</view>
            <view class="muted">{{ s.tags.join(' / ') }}</view>
          </view>
          <van-tag :type="s.black? 'danger':'success'">{{ s.black? '黑名单':'正常' }}</van-tag>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const list = [
  { id: 'sp1', name: '蔬菜供应商A', tags: ['蔬菜', '本地'], black: false },
  { id: 'sp2', name: '肉类供应商B', tags: ['肉类'], black: true },
]
</script>

<style scoped>
</style>

