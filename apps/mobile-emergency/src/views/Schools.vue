<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'
import '../styles/theme.css'

const list = ref<Array<{ id: string; name: string }>>([])
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  try { list.value = await api.regSchools() } finally { loading.value = false }
})
</script>

<template>
  <div class="page">
    <van-nav-bar title="学校档案" left-arrow @click-left="$router.back()" />
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">学校列表</div>
      <div class="list">
        <div class="list-item" v-for="s in list" :key="s.id">
          <div>
            <div style="font-weight:600;">{{ s.name }}</div>
            <div class="muted">可查看督查、自查、食堂档案与台账</div>
          </div>
          <van-button size="small" type="primary" @click="$router.push(`/schools/${s.id}`)">进入</van-button>
        </div>
        <div v-if="!list.length && !loading" class="muted">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
