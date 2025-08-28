<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; gap: 12px">
        <span>已接入设备信息</span>
        <el-input
          v-model="q"
          placeholder="搜索设备ID/名称/SN/IP"
          clearable
          style="width: 260px"
          @keyup.enter="load"
        />
        <el-select v-model="type" placeholder="类型" clearable style="width: 160px">
          <el-option v-for="t in types" :key="t" :label="typeLabel(t)" :value="t" />
        </el-select>
        <el-select v-model="status" placeholder="状态" clearable style="width: 160px">
          <el-option v-for="s in statuses" :key="s" :label="statusLabel(s)" :value="s" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="设备ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">{{ typeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'ONLINE' ? 'success' : row.status === 'FAULT' ? 'danger' : 'info'"
          >
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="位置" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="sn" label="序列号" width="160" />
      <el-table-column prop="model" label="型号" width="120" />
      <el-table-column prop="firmware" label="固件" width="120" />
      <el-table-column prop="lastSeen" label="最近在线" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';

type Device = {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  ip?: string;
  sn?: string;
  model?: string;
  firmware?: string;
  lastSeen: string;
};
const rows = ref<Device[]>([]);
const types = ref<string[]>([]);
const statuses = ref<string[]>([]);
const type = ref<string>();
const status = ref<string>();
const q = ref<string>('');
const loading = ref(false);

const typeLabel = (t?: string) =>
  (
    ({ GATEWAY: '网关', CAMERA: '摄像头', SCALE: '留样秤', SENSOR: '传感器', SMOKE: '烟感' }) as any
  )[t || ''] ||
  t ||
  '';
const statusLabel = (s?: string) =>
  (({ ONLINE: '在线', OFFLINE: '离线', FAULT: '故障' }) as any)[s || ''] || s || '';

async function load() {
  loading.value = true;
  try {
    rows.value = await api.devicesList({ type: type.value, status: status.value, q: q.value });
  } finally {
    loading.value = false;
  }
}

async function init() {
  types.value = await api.deviceTypes();
  statuses.value = await api.deviceStatuses();
  await load();
}

onMounted(init);
</script>
