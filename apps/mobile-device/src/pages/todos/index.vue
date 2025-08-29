<template>
  <view class="page">
    <van-nav-bar title="今日待办" left-arrow @click-left="goBack" />
    <view v-if="!canteenId" class="placeholder">请先选择学校与食堂</view>
    <view v-else>
      <van-skeleton title :row="4" v-if="loading" />
      <view v-else>
        <div class="card" style="margin-bottom:12px;">
          <div class="title" style="margin-bottom:8px;">今日未上报</div>
          <van-empty v-if="!data.notReportedToday.length" description="无未上报" />
          <van-cell-group v-else inset>
            <van-cell v-for="it in data.notReportedToday" :key="it.id" :title="it.name" />
          </van-cell-group>
        </div>
        <div class="card">
          <div class="title" style="margin-bottom:8px;">隐患排查任务</div>
          <van-empty v-if="!data.hazardTasks.length" description="暂无任务" />
          <van-cell-group v-else inset>
            <van-cell v-for="t in data.hazardTasks" :key="t.id" :title="t.title" :label="t.due">
              <template #value>
                <van-tag :type="t.status==='overdue' ? 'danger' : 'warning'">{{ t.status==='overdue'?'逾期':'待处理' }}</van-tag>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { selectedCanteenId } from '../../stores/tenant'
import { fetchTodos, type TodoData } from '../../services/data'

const canteenId = selectedCanteenId
const data = ref<TodoData>({ date: '', canteenId: '', notReportedToday: [], hazardTasks: [] })
const loading = ref(false)

async function load() {
  if (!canteenId.value) return
  loading.value = true
  data.value = await fetchTodos(dayjs().format('YYYY-MM-DD'), canteenId.value)
  loading.value = false
}

function goBack() { try { (uni as any).navigateBack?.() } catch {}; try { history.back() } catch {} }

onMounted(load)
</script>

<style></style>

