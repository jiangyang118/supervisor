<script setup lang="ts">
import '../styles/theme.css'
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { api } from '../api'

const router = useRouter()
const schools = ref<Array<{ id: string; name: string }>>([])
onMounted(async () => {
  try { schools.value = await api.regSchools() } catch {}
})

const tiles = [
  { icon: 'records', label: '学校档案', to: '/schools' },
  { icon: 'video-o', label: '实时监控', to: '/monitor' },
  { icon: 'warning-o', label: '预警信息', to: '/alerts' },
  { icon: 'todo-list-o', label: '检查任务', to: '/tasks' },
  { icon: 'chat-o', label: '公众反馈', to: '/feedback' },
  { icon: 'newspaper-o', label: '资讯简报', to: '/news' },
]
</script>

<template>
  <div class="page">
    <van-nav-bar title="应急指挥中心" />

    <div class="card" style="margin-top:10px;">
      <div class="subtitle">单位总览</div>
      <div class="list" style="display:flex; gap:12px; flex-wrap:wrap; margin-top:8px;">
        <div v-for="s in schools" :key="s.id" class="list-item" style="flex:1 1 calc(50% - 6px);">
          <div>{{ s.name }}</div>
          <van-tag type="primary">学校</van-tag>
        </div>
        <div v-if="!schools.length" class="muted">暂无学校数据</div>
      </div>
    </div>

    <div class="card" style="margin-top:10px;">
      <div class="subtitle">功能快捷</div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top:8px;">
        <button v-for="t in tiles" :key="t.to" class="list-item" style="text-align:center; flex-direction:column; gap:8px;" @click="router.push(t.to)">
          <van-icon :name="t.icon" />
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-item button { border: none; }
</style>

