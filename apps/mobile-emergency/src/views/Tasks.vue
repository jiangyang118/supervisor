<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'
import '../styles/theme.css'

const list = ref<any[]>([])
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  try { list.value = await api.regAiTasks() } finally { loading.value = false }
})
</script>

<template>
  <div class="page">
    <van-nav-bar title="检查任务" left-arrow @click-left="$router.back()" />
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">任务列表</div>
      <div class="list">
        <div class="list-item" v-for="t in list" :key="t.id">
          <div>
            <div style="font-weight:600;">{{ t.name || '任务' }}</div>
            <div class="muted">{{ t.status }} · {{ t.createdAt }}</div>
          </div>
          <van-button size="small">查看</van-button>
        </div>
        <div v-if="!list.length && !loading" class="muted">暂无任务</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

