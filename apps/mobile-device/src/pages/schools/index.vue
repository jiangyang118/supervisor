<template>
  <view class="page">
    <van-nav-bar title="选择学校" left-arrow @click-left="goBack" />
    <view v-if="loading" class="placeholder">加载中…</view>
    <van-cell-group v-else inset>
      <van-cell
        v-for="s in list"
        :key="s.id"
        :title="s.name"
        is-link
        @click="pick(s.id)"
      />
    </van-cell-group>
  </view>
  
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchSchools } from '../../services/data'
import { setSchool, setCanteen } from '../../stores/tenant'

const list = ref<{ id: string; name: string }[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  list.value = await fetchSchools()
  loading.value = false
}

function pick(id: string) {
  setSchool(id)
  setCanteen(null)
  uni.navigateTo({ url: '/pages/canteens/index' })
}

function goBack() {
  try { (uni as any).navigateBack?.() } catch {}
  try { history.back() } catch {}
}

onMounted(load)
</script>

<style></style>
