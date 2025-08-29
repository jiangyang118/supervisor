<template>
  <view class="page">
    <van-nav-bar title="选择食堂" left-arrow @click-left="goBack" />
    <van-empty v-if="!schoolId" description="请先选择学校" />
    <view v-else>
      <view v-if="loading" class="placeholder">加载中…</view>
      <van-cell-group v-else inset>
        <van-cell
          v-for="c in list"
          :key="c.id"
          :title="c.name"
          is-link
          @click="pick(c.id)"
        />
        <view v-if="!list.length" class="placeholder">暂无食堂</view>
      </van-cell-group>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchCanteensBySchool } from '../../services/data'
import { selectedSchoolId, setCanteen } from '../../stores/tenant'

const schoolId = selectedSchoolId
const list = ref<{ id: string; name: string }[]>([])
const loading = ref(false)

async function load() {
  if (!schoolId.value) return
  loading.value = true
  list.value = await fetchCanteensBySchool(schoolId.value)
  loading.value = false
}

function pick(id: string) {
  setCanteen(id)
  uni.navigateTo({ url: '/pages/devices/index' })
}

function goBack() {
  try { (uni as any).navigateBack?.() } catch {}
  try { history.back() } catch {}
}

onMounted(load)
</script>

<style></style>
