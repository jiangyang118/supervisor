<template>
  <view class="page">
    <van-nav-bar title="智能检查" left-arrow @click-left="goBack" />
    <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
    <view v-else>
      <van-skeleton title :row="3" v-if="loading" />
      <van-cell-group v-else inset>
        <van-cell
          v-for="it in list"
          :key="it.id"
          :title="it.rule"
          :label="it.time"
        >
          <template #value>
            <van-tag :type="tagType(it.level)">{{ levelText(it.level) }}</van-tag>
          </template>
        </van-cell>
        <van-empty v-if="!list.length" description="今日暂无记录" />
      </van-cell-group>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { selectedCanteenId } from '../../stores/tenant'
import { fetchSmartChecks, type SmartCheckItem } from '../../services/data'

const canteenId = selectedCanteenId
const list = ref<SmartCheckItem[]>([])
const loading = ref(false)

function levelText(l: SmartCheckItem['level']) {
  return l === 'error' ? '严重' : l === 'warn' ? '提醒' : '正常'
}
function tagType(l: SmartCheckItem['level']) {
  return l === 'error' ? 'danger' : l === 'warn' ? 'warning' : 'success'
}

async function load() {
  if (!canteenId.value) return
  loading.value = true
  list.value = await fetchSmartChecks(dayjs().format('YYYY-MM-DD'), canteenId.value)
  loading.value = false
}

function goBack() { try { (uni as any).navigateBack?.() } catch {}; try { history.back() } catch {} }

onMounted(load)
</script>

<style></style>

