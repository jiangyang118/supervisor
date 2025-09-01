<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'
import '../styles/theme.css'

const schoolId = ref<string | undefined>(undefined)
const schools = ref<Array<{ id: string; name: string }>>([])
const list = ref<any[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const { items } = await api.regAiEvents({ schoolId: schoolId.value, page: 1, pageSize: 50 })
    list.value = items
  } finally { loading.value = false }
}

onMounted(async () => {
  schools.value = await api.regSchools()
  schoolId.value = schools.value[0]?.id
  await load()
})
</script>

<template>
  <div class="page">
    <van-nav-bar title="预警信息" left-arrow @click-left="$router.back()" />
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">学校</div>
      <van-picker v-if="schools.length" :columns="schools.map(s=>({ text: s.name, value: s.id }))" @confirm="(v:any)=>{ schoolId=v.selectedOptions?.[0]?.value; load(); }" />
    </div>
    <div class="card" style="margin-top:10px;">
      <div class="subtitle">预警列表</div>
      <div class="list">
        <div class="list-item" v-for="e in list" :key="e.id">
          <div style="display:flex; gap:10px; align-items:center;">
            <img v-if="e.snapshot" :src="e.snapshot" style="width:66px;height:44px;object-fit:cover;border-radius:8px;" />
            <div>
              <div style="font-weight:600;">{{ e.typeLabel }}</div>
              <div class="muted">{{ e.at }}</div>
            </div>
          </div>
          <van-tag :type="e.status==='OPEN'?'danger':(e.status==='ACK'?'warning':'success')">{{ e.status }}</van-tag>
        </div>
        <div v-if="!list.length && !loading" class="muted">暂无预警</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

