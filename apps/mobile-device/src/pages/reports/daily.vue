<template>
  <view class="page">
    <van-nav-bar title="食堂日报" left-arrow @click-left="goBack" />
    <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
    <view v-else>
      <van-skeleton title :row="4" v-if="loading" />
      <van-cell-group v-else inset>
        <van-cell title="晨检" :value="ratioText(data.morningCheck)" />
        <van-cell title="消毒" :value="ratioText(data.disinfection)" />
        <van-cell title="废弃物处理" :value="ratioText(data.waste)" />
        <van-cell title="留样" :value="ratioText(data.sampling)" />
        <van-cell title="陪餐" :value="ratioText(data.accompanyMeal)" />
        <van-cell title="卫生检查" :value="ratioText(data.hygiene)" />
      </van-cell-group>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { selectedCanteenId } from '../../stores/tenant'
import { fetchDailyReport, type DailyReport } from '../../services/data'

const canteenId = selectedCanteenId
const data = ref<DailyReport>({
  date: '', canteenId: '',
  morningCheck: { reported: 0, total: 0 },
  disinfection: { reported: 0, total: 0 },
  waste: { reported: 0, total: 0 },
  sampling: { reported: 0, total: 0 },
  accompanyMeal: { reported: 0, total: 0 },
  hygiene: { reported: 0, total: 0 },
})
const loading = ref(false)

function ratioText(x: { reported: number; total: number }) {
  const ok = x.total > 0 && x.reported >= x.total
  const txt = `${x.reported}/${x.total}`
  return ok ? txt + '（完成）' : txt
}

async function load() {
  if (!canteenId.value) return
  loading.value = true
  data.value = await fetchDailyReport(dayjs().format('YYYY-MM-DD'), canteenId.value)
  loading.value = false
}

function goBack() { try { (uni as any).navigateBack?.() } catch {}; try { history.back() } catch {} }

onMounted(load)
</script>

<style></style>

