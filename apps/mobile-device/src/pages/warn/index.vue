<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">预警中心</text></view>
      <view v-if="loading" class="placeholder">加载中…</view>
      <view class="list" v-else>
        <view class="list-item" v-for="e in items" :key="e.id">
          <view style="display:flex;align-items:center;gap:12px;flex:1">
            <img v-if="e.snapshot" :src="e.snapshot" alt="snap" style="width:66px;height:44px;object-fit:cover;border-radius:6px" />
            <view>
              <view style="font-weight:600">{{ e.typeLabel }}</view>
              <view class="muted">{{ e.at }}</view>
            </view>
          </view>
          <van-tag :type="tagType(e.status)">{{ statusText(e.status) }}</van-tag>
        </view>
        <view v-if="!items.length" class="placeholder">暂无预警</view>
      </view>
    </view>
  </view>
  
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAiEvents, type AiEvent } from '../../api/modules/ai'
import { selectedSchoolId } from '../../stores/tenant'

const schoolId = selectedSchoolId
const items = ref<AiEvent[]>([])
const loading = ref(false)

function statusText(s: AiEvent['status']) {
  return s === 'OPEN' ? '未处理' : s === 'ACK' ? '已接收' : '已关闭'
}
function tagType(s: AiEvent['status']) {
  return s === 'OPEN' ? 'danger' : s === 'ACK' ? 'warning' : 'success'
}

async function load() {
  loading.value = true
  try {
    const { items: list } = await fetchAiEvents({ schoolId: schoolId.value || undefined, page: 1, pageSize: 20 })
    items.value = list
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
</style>
