<template>
  <view class="page">
    <van-nav-bar title="实时监控" left-arrow @click-left="goBack" />
    <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
    <view v-else>
      <van-skeleton title :row="3" v-if="loading" />
      <van-cell-group v-else inset>
        <van-cell
          v-for="cam in cameras"
          :key="cam.id"
          :title="cam.name"
        >
          <template #label>
            <van-tag :type="cam.online ? 'success' : 'default'">{{ cam.online ? '在线' : '离线' }}</van-tag>
          </template>
        </van-cell>
      </van-cell-group>

      <view v-if="current && current.online" style="margin-top:12px;" class="card">
        <div style="margin-bottom:8px;" class="title">{{ current.name }}</div>
        <video
          v-if="current.stream"
          :src="current.stream"
          style="width:100%; border-radius:8px; background:#000;"
          controls
          playsinline
          webkit-playsinline
        />
        <van-empty v-else description="无可用视频流" />
      </view>

      <van-empty v-if="!cameras.length && !loading" description="暂无摄像头" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { selectedCanteenId } from '../../stores/tenant'
import { fetchCameras, type Camera } from '../../services/data'

const canteenId = selectedCanteenId
const cameras = ref<Camera[]>([])
const current = ref<Camera | null>(null)
const loading = ref(false)

async function load() {
  if (!canteenId.value) return
  loading.value = true
  cameras.value = await fetchCameras(canteenId.value)
  loading.value = false
  current.value = cameras.value.find(c => c.online) || cameras.value[0] || null
}

watch(cameras, () => {
  if (current.value && !cameras.value.find(c => c.id === current.value!.id)) {
    current.value = cameras.value[0] || null
  }
})

function goBack() { try { (uni as any).navigateBack?.() } catch {}; try { history.back() } catch {} }

onMounted(load)
</script>

<style></style>

