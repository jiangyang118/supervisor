<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">实时监控</text></view>
      <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
      <view v-else>
        <view class="list">
          <view class="list-item" v-for="cam in list" :key="cam.id">
            <view style="flex:1; margin-right:12px;">
              <view style="font-weight:600">{{ cam.name }}</view>
              <view class="muted" v-if="!cam.online">离线，展示快照</view>
            </view>
          </view>
        </view>
        <view class="section" v-for="cam in list" :key="cam.id + '-player'">
          <VideoPlayer :hls-url="cam.online ? cam.stream : ''" :snapshot="snapshotUrl(cam)" :autoplay="true" :muted="true" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchSchoolCameras, type Camera } from '../../api/modules/bright'
import { selectedSchoolId } from '../../stores/tenant'
import VideoPlayer from '../../components/VideoPlayer.vue'

const schoolId = selectedSchoolId
const list = ref<Camera[]>([])

function snapshotUrl(c: Camera) {
  // 占位图：若摄像头离线或无 hlsUrl
  return `https://picsum.photos/seed/${c.schoolId}-${c.id}/480/270`
}

async function load() {
  const sid = schoolId.value || undefined
  list.value = await fetchSchoolCameras(sid)
}

onMounted(load)
</script>

<style scoped>
</style>
