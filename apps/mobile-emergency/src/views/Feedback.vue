<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'
import '../styles/theme.css'

const list = ref<any[]>([])
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  try { list.value = await api.feedback() } finally { loading.value = false }
})
</script>

<template>
  <div class="page">
    <van-nav-bar title="公众反馈" left-arrow @click-left="$router.back()" />
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">反馈列表</div>
      <div class="list">
        <div class="list-item" v-for="f in list" :key="f.id">
          <div>
            <div style="font-weight:600;">{{ f.title || f.subject || '反馈' }}</div>
            <div class="muted">{{ f.time || f.at || '' }}</div>
          </div>
          <van-button size="small">查看</van-button>
        </div>
        <div v-if="!list.length && !loading" class="muted">暂无反馈</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

