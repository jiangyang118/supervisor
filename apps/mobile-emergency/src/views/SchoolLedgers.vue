<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const schoolId = ref<string>(String(route.params.id || ''))
const active = ref(0)
const sampling = ref<any[]>([])
const disinfection = ref<any[]>([])
const dine = ref<any[]>([])
const waste = ref<any[]>([])
const morning = ref<any[]>([])
const inbound = ref<any[]>([])
const outbound = ref<any[]>([])

async function loadAll() {
  const [{ items: s }, { items: d }, { items: dn }, { items: w }, m, ih, oh] = await Promise.all([
    api.regLedgersSampling(schoolId.value),
    api.regLedgersDisinfection(schoolId.value),
    api.regLedgersDine(schoolId.value),
    api.regLedgersWaste(schoolId.value),
    api.morningChecks({ schoolId: schoolId.value, page: 1, pageSize: 50 }),
    api.inboundHistory(schoolId.value),
    api.outboundHistory(schoolId.value),
  ])
  sampling.value = s
  disinfection.value = d
  dine.value = dn
  waste.value = w
  morning.value = m.items
  inbound.value = ih
  outbound.value = oh
}

onMounted(loadAll)
</script>

<template>
  <div class="page">
    <van-nav-bar title="台账与报表" left-arrow @click-left="$router.back()" />
    <van-tabs v-model:active="active" sticky>
      <van-tab title="留样">
        <div class="list">
          <div class="list-item" v-for="r in sampling" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.sample }}</div>
              <div class="muted">重量：{{ r.weight }} · 时间：{{ r.at }}</div>
            </div>
            <van-tag>留样</van-tag>
          </div>
        </div>
      </van-tab>
      <van-tab title="消毒">
        <div class="list">
          <div class="list-item" v-for="r in disinfection" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.method }}</div>
              <div class="muted">对象：{{ r.items }} · 时长：{{ r.duration }}min · {{ r.at }}</div>
            </div>
            <van-tag type="success">{{ r.status }}</van-tag>
          </div>
        </div>
      </van-tab>
      <van-tab title="陪餐">
        <div class="list">
          <div class="list-item" v-for="r in dine" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.meal }}</div>
              <div class="muted">人员：{{ r.people }} · {{ r.at }}</div>
            </div>
            <van-tag type="primary">陪餐</van-tag>
          </div>
        </div>
      </van-tab>
      <van-tab title="废弃物">
        <div class="list">
          <div class="list-item" v-for="r in waste" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.category }}</div>
              <div class="muted">数量：{{ r.amount }} · 处理人：{{ r.person }} · {{ r.date }}</div>
            </div>
            <van-tag type="warning">废弃物</van-tag>
          </div>
        </div>
      </van-tab>
      <van-tab title="晨检">
        <div class="list">
          <div class="list-item" v-for="r in morning" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.staff }}</div>
              <div class="muted">体温：{{ r.temp }}℃ · 结果：{{ r.result }} · {{ r.at }}</div>
            </div>
            <van-tag :type="r.result==='正常'?'success':'danger'">{{ r.result }}</van-tag>
          </div>
        </div>
      </van-tab>
      <van-tab title="入库">
        <div class="list">
          <div class="list-item" v-for="r in inbound" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.product || r.name }}</div>
              <div class="muted">数量：{{ r.qty || r.weight }} · 供应商：{{ r.supplier || '-' }} · {{ r.time || r.at }}</div>
            </div>
            <van-tag type="primary">入库</van-tag>
          </div>
        </div>
      </van-tab>
      <van-tab title="出库">
        <div class="list">
          <div class="list-item" v-for="r in outbound" :key="r.id">
            <div>
              <div style="font-weight:600;">{{ r.product || r.name }}</div>
              <div class="muted">数量：{{ r.qty || r.weight }} · 用途：{{ r.purpose || '-' }} · {{ r.time || r.at }}</div>
            </div>
            <van-tag type="primary">出库</van-tag>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<style scoped></style>

