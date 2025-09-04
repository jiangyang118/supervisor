<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span>环境状态</span>
        <el-input v-model="q" placeholder="搜索名称/位置" clearable style="width:220px" @keyup.enter="load" />
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
      </div>
    </template>

    <el-alert type="info" :closable="false" show-icon style="margin-bottom:8px"
      title="展示温湿度、烟感/燃气等环境传感器状态（数据来自设备清单）" />

    <el-tabs v-model="tab">
      <el-tab-pane label="温湿度/环境传感器" name="sensors">
        <el-table :data="sensors" size="small" border>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="location" label="位置" />
          <el-table-column label="温度(°C)" width="120">
            <template #default="{ row }">{{ row.metrics?.temp ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="湿度(%)" width="120">
            <template #default="{ row }">{{ row.metrics?.humidity ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="lastSeen" label="最近上报" width="180" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status==='ONLINE' ? 'success' : row.status==='FAULT' ? 'danger' : 'info'">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="烟感/燃气" name="gas">
        <el-table :data="gasSensors" size="small" border>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="location" label="位置" />
          <el-table-column label="可燃气体(ppm)" width="160">
            <template #default="{ row }">{{ row.metrics?.gas ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="lastSeen" label="最近上报" width="180" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status==='ONLINE' ? 'success' : row.status==='FAULT' ? 'danger' : 'info'">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

type Device = { id: string; name: string; type: string; status: string; location?: string; lastSeen: string; metrics?: Record<string, any> };
const sensors = ref<Device[]>([]);
const gasSensors = ref<Device[]>([]);
const q = ref('');
const loading = ref(false);
const tab = ref<'sensors'|'gas'>('sensors');

const statusLabel = (s?: string) => (({ ONLINE: '在线', OFFLINE: '离线', FAULT: '故障' }) as any)[s||''] || s || '';

async function load() {
  loading.value = true;
  try {
    const qs = new URLSearchParams();
    if (q.value) qs.set('q', q.value);
    const [sensorList, smokeList] = await Promise.all([
      fetch(`/api/school/devices?type=SENSOR&${qs.toString()}`).then((r)=>r.json()),
      fetch(`/api/school/devices?type=SMOKE&${qs.toString()}`).then((r)=>r.json()),
    ]);
    sensors.value = (sensorList as Device[]).filter((d) => d.metrics && (d.metrics.temp !== undefined || d.metrics.humidity !== undefined));
    gasSensors.value = ([...sensorList, ...smokeList] as Device[]).filter((d) => (d.type==='SMOKE') || (d.metrics && d.metrics.gas !== undefined));
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

