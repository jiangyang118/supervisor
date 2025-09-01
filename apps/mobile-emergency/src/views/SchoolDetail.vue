<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const schoolId = ref<string>(String(route.params.id || ''))
const active = ref(0)
const canteens = ref<any[]>([])
const workers = ref<any[]>([])
const suppliers = ref<any[]>([])
const exceptions = ref<any[]>([])
const insp = ref<any[]>([])

async function loadArchive() {
  canteens.value = await api.regCanteens(schoolId.value)
  workers.value = await api.regWorkers(schoolId.value)
  suppliers.value = await api.regSuppliers(schoolId.value)
  exceptions.value = await api.regExceptions(schoolId.value)
}
async function loadInspections() {
  const res = await api.schoolDaily(schoolId.value)
  insp.value = res?.hygiene || []
}

onMounted(async () => { await loadArchive(); await loadInspections() })
</script>

<template>
  <div class="page">
    <van-nav-bar title="学校档案详情" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="active" sticky>
      <van-tab title="档案">
        <div class="card" style="margin-top:10px;">
          <div class="subtitle">食堂档案</div>
          <div class="list">
            <div class="list-item" v-for="c in canteens" :key="c.id">
              <div>
                <div style="font-weight:600;">{{ c.name }}</div>
                <div class="muted">许可证到期：{{ c.licenseExpireAt || '-' }}</div>
              </div>
              <van-tag type="primary">食堂</van-tag>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:10px;">
          <div class="subtitle">工勤人员</div>
          <div class="list">
            <div class="list-item" v-for="w in workers" :key="w.id">
              <div>
                <div style="font-weight:600;">{{ w.name }}</div>
                <div class="muted">岗位：{{ w.role || '-' }} · 健康证到期：{{ w.healthCertExpireAt || '-' }}</div>
              </div>
              <van-tag>人员</van-tag>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:10px;">
          <div class="subtitle">供应商</div>
          <div class="list">
            <div class="list-item" v-for="s in suppliers" :key="s.id">
              <div>
                <div style="font-weight:600;">{{ s.name }}</div>
                <div class="muted">电话：{{ s.phone || '-' }} · 执照到期：{{ s.licenseExpireAt || '-' }}</div>
              </div>
              <van-tag type="success">供应商</van-tag>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:10px;">
          <div class="subtitle">证照异常</div>
          <div class="list">
            <div class="list-item" v-for="e in exceptions" :key="e.id">
              <div>
                <div style="font-weight:600;">{{ e.type }} · {{ e.entityName }}</div>
                <div class="muted">到期：{{ e.expireAt }} · 处理：{{ e.measure || '未处理' }}</div>
              </div>
              <van-tag type="danger">异常</van-tag>
            </div>
            <div v-if="!exceptions.length" class="muted">暂无异常</div>
          </div>
        </div>
      </van-tab>
      <van-tab title="督查·自查">
        <div class="card" style="margin-top:10px;">
          <div class="subtitle">近期记录</div>
          <div class="list">
            <div class="list-item" v-for="h in insp" :key="h.id">
              <div>
                <div style="font-weight:600;">{{ h.item || '卫生检查' }}</div>
                <div class="muted">结果：{{ h.result || '-' }} · {{ h.date || h.at }}</div>
              </div>
              <van-tag :type="h.result==='合格'?'success':'danger'">{{ h.result || '-' }}</van-tag>
            </div>
            <div v-if="!insp.length" class="muted">暂无数据</div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<style scoped lang="less">
.muted { color: #595959; }
</style>

