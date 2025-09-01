<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'
import '../styles/theme.css'

const schoolId = ref<string | undefined>(undefined)
const schools = ref<Array<{ id: string; name: string }>>([])
const cams = ref<any[]>([])
const loading = ref(false)

async function loadCams() {
  loading.value = true
  try { cams.value = await api.regCameras(schoolId.value) } finally { loading.value = false }
}

async function loadSchools() {
  schools.value = await api.regSchools()
  if (schools.value.length) { schoolId.value = schools.value[0].id; await loadCams() }
}

async function snapshot(cam: any) {
  if (!schoolId.value) return
  await api.makeSnapshot({ schoolId: schoolId.value, cameraId: cam.id })
  await loadCams()
}

onMounted(() => { loadSchools() })
</script>

<template>
  <div class="page">
    <van-nav-bar title="实时监控" left-arrow @click-left="$router.back()" />
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">选择学校</div>
      <van-picker v-if="schools.length" :columns="schools.map(s=>({ text: s.name, value: s.id }))" @confirm="(v:any)=>{ schoolId=v.selectedOptions?.[0]?.value; loadCams(); }" />
    </div>
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">摄像头</div>
      <div class="list">
        <div class="list-item" v-for="c in cams" :key="c.id">
          <div>
            <div style="font-weight:600;">{{ c.name }}</div>
            <div class="muted">{{ c.online ? '在线' : '离线' }}</div>
          </div>
          <van-button type="primary" size="small" @click="snapshot(c)">快照</van-button>
        </div>
        <div v-if="!cams.length && !loading" class="muted">暂无摄像头</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

