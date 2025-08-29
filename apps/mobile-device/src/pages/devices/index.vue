<template>
  <view class="page">
    <van-nav-bar title="设备列表" left-arrow right-text="刷新" @click-left="goBack" @click-right="refresh" />

    <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
    <view v-else>
      <view v-if="loading" class="placeholder">加载中…</view>
      <van-cell-group v-else inset>
        <van-cell v-for="d in list" :key="d.id" :title="d.name" :label="d.type" is-link @click="goDetail(d.id)">
          <template #value>
            <van-tag :type="tagType(d.status)" :plain="d.status==='offline'">{{ statusText(d.status) }}</van-tag>
          </template>
        </van-cell>
        <view v-if="!list.length" class="placeholder">暂无设备</view>
      </van-cell-group>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchDevicesByCanteen } from '../../services/data'
import { selectedCanteenId } from '../../stores/tenant'

const canteenId = selectedCanteenId
const list = ref<any[]>([])
const loading = ref(false)

function statusText(s: string) {
  return s === 'online' ? '在线' : s === 'offline' ? '离线' : '异常'
}

function tagType(s: string) {
  if (s === 'online') return 'success'
  if (s === 'error') return 'danger'
  return undefined
}

async function load() {
  if (!canteenId.value) return
  loading.value = true
  list.value = await fetchDevicesByCanteen(canteenId.value)
  loading.value = false
}

function refresh() { load() }

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/devices/detail?id=${id}` })
}

function goBack() {
  try { (uni as any).navigateBack?.() } catch {}
  try { history.back() } catch {}
}

onMounted(load)
</script>

<style></style>
