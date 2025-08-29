<template>
  <view class="page">
    <view class="card">
      <view class="header"><text class="title">今日待办</text></view>
      <view class="section">
        <view class="section-heading"><view class="label">未上报（{{ notReported.length }}）</view></view>
        <view class="list">
          <view class="list-item" v-for="x in notReported" :key="x.id">
            <view>{{ x.name }}</view>
            <van-button size="small" type="primary" plain @click="gotoForm(x.id)">去上报</van-button>
          </view>
          <view v-if="!notReported.length" class="placeholder">暂无未上报</view>
        </view>
      </view>
      <view class="section">
        <view class="section-heading"><view class="label">隐患排查</view></view>
        <view class="list">
          <view class="list-item" v-for="t in hazardTasks" :key="t.id">
            <view>
              <view style="font-weight:600">{{ t.title }}</view>
              <view class="muted">截止：{{ t.due }}</view>
            </view>
            <van-tag :type="t.status==='overdue'?'danger':'warning'">{{ t.status==='overdue'?'逾期':'待办' }}</van-tag>
          </view>
          <view v-if="!hazardTasks.length" class="placeholder">暂无隐患任务</view>
        </view>
      </view>
    </view>
  </view>
  
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchSchoolDaily } from '../../api/modules/reports'
import { fetchAiEvents } from '../../api/modules/ai'
import { selectedSchoolId } from '../../stores/tenant'

const schoolId = selectedSchoolId
const notReported = ref<Array<{ id: string; name: string }>>([])
const hazardTasks = ref<Array<{ id: string; title: string; due: string; status: 'pending' | 'overdue' }>>([])

async function load() {
  const sid = schoolId.value || undefined
  const today = new Date().toISOString().slice(0,10)
  // derive notReported from daily KPI == 0
  try {
    const daily = await fetchSchoolDaily(sid)
    const zeros: Array<{ id: string; name: string }> = []
    if (!daily.kpi.disinfection) zeros.push({ id: 'disinfection', name: '消毒记录未上报' })
    if (!daily.kpi.hygienePassRate) zeros.push({ id: 'hygiene', name: '卫生检查未上报' })
    if (!daily.kpi.morning) zeros.push({ id: 'morning', name: '晨检未上报' })
    if (!daily.kpi.waste) zeros.push({ id: 'waste', name: '废弃物处理未上报' })
    notReported.value = zeros
  } catch {
    notReported.value = []
  }
  // hazard tasks from OPEN ai events as proxy
  try {
    const { items } = await fetchAiEvents({ schoolId: sid, page: 1, pageSize: 10 })
    hazardTasks.value = items
      .filter((e) => e.status === 'OPEN')
      .slice(0, 5)
      .map((e) => ({ id: e.id, title: e.typeLabel, due: `${today} 17:00`, status: 'pending' as const }))
  } catch {
    hazardTasks.value = []
  }
}

function gotoForm(id: string) {
  // TODO: 跳转到对应台账页面
}

onMounted(load)
</script>

<style scoped>
</style>
