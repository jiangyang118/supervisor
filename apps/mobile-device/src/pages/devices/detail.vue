<template>
  <view class="page">
    <van-nav-bar title="设备详情" left-arrow @click-left="goBack" />
    <view v-if="!detail" class="placeholder">加载中…</view>
    <van-cell-group v-else inset>
      <van-cell title="名称" :value="detail.name" />
      <van-cell title="类型" :value="detail.type" />
      <van-cell title="状态">
        <template #value>
          <van-tag :type="tagType(detail.status)" :plain="detail.status==='offline'">{{ statusText(detail.status) }}</van-tag>
        </template>
      </van-cell>
      <van-cell title="最近上线" :value="detail.lastSeen || '-'" />
      <van-cell title="设备ID" :value="detail.id" />
    </van-cell-group>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchDeviceById } from '../../services/data'

const detail = ref<any>(null)

function statusText(s: string) {
  return s === 'online' ? '在线' : s === 'offline' ? '离线' : '异常'
}

function tagType(s: string) {
  if (s === 'online') return 'success'
  if (s === 'error') return 'danger'
  return undefined
}

async function load() {
  const id = (uni as any).getCurrentPages?.()?.slice(-1)?.[0]?.options?.id || ''
  const d = await fetchDeviceById(id)
  detail.value = d || null
}

function goBack() {
  try { (uni as any).navigateBack?.() } catch {}
  try { history.back() } catch {}
}

onMounted(load)
</script>

<style></style>
