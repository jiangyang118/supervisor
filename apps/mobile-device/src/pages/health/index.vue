<template>
  <view class="page">
    <van-nav-bar title="工勤健康" left-arrow @click-left="goBack" />
    <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
    <view v-else>
      <van-skeleton title :row="3" v-if="loading" />
      <div v-else>
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="title">健康证总数</div>
            <div class="subtle">包含在岗工勤人员</div>
          </div>
          <div style="font-size:22px; font-weight:600;">{{ data.total }}</div>
        </div>
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <div>
            <div class="title">过期数量</div>
            <div class="subtle">需尽快处理</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <van-tag type="danger">过期</van-tag>
            <div style="font-size:22px; font-weight:600;">{{ data.expired }}</div>
          </div>
        </div>
        <div class="section card" style="margin-top:12px;">
          <div class="title" style="margin-bottom:8px;">过期人员</div>
          <van-empty v-if="!data.expiredList.length" description="暂无过期" />
          <van-cell-group v-else inset>
            <van-cell v-for="p in data.expiredList" :key="p.userId" :title="p.name" :label="`到期：${p.expireDate}`" />
          </van-cell-group>
        </div>
      </div>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { selectedCanteenId } from '../../stores/tenant'
import { fetchHealthStats, type HealthStats } from '../../services/data'

const canteenId = selectedCanteenId
const data = ref<HealthStats>({ canteenId: '', total: 0, expired: 0, expiredList: [] })
const loading = ref(false)

async function load() {
  if (!canteenId.value) return
  loading.value = true
  data.value = await fetchHealthStats(canteenId.value)
  loading.value = false
}

function goBack() { try { (uni as any).navigateBack?.() } catch {}; try { history.back() } catch {} }

onMounted(load)
</script>

<style></style>

