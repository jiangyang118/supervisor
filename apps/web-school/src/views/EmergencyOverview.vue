<template>
  <el-card>
    <template #header>应急管理 - 概览</template>
    <el-row :gutter="12">
      <el-col :span="8"
        ><el-card
          ><template #header>事件</template>
          <div>{{ ov.totalEvents }}</div></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>演练</template>
          <div>{{ ov.totalDrills }}</div></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>会议提醒</template>
          <div>{{ ov.openMeetings }}</div></el-card
        ></el-col
      >
    </el-row>
    <el-divider />
    <el-card>
      <template #header>值守班组</template>
      <el-table :data="ov.duty" size="small" border>
        <el-table-column prop="name" label="班组" />
        <el-table-column label="成员"
          ><template #default="{ row }">{{
            (row.members || []).join(',')
          }}</template></el-table-column
        >
        <el-table-column prop="oncall" label="值守" width="140" />
      </el-table>
    </el-card>
    <el-divider />
    <el-card>
      <template #header>最新警报</template>
      <el-table :data="ov.recentAlerts" size="small" border>
        <el-table-column prop="id" label="ID" width="140" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="accept(row)">接警</el-button>
            <el-button size="small" type="danger" @click="clearEv(row)">消警</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </el-card>

  <div style="margin-top: 8px">
    <el-button size="small" @click="raise('事件')">模拟事件警报</el-button>
    <el-button size="small" @click="raise('演练')">模拟演练警报</el-button>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount } from 'vue';
import { api, API_BASE } from '../services/api';
const ov = reactive<any>({
  totalEvents: 0,
  totalDrills: 0,
  openMeetings: 0,
  duty: [],
  recentAlerts: [],
});
async function load() {
  Object.assign(ov, await api.emergOverview());
}
async function accept(row: any) {
  const ev = (await api.emergEvents({})).find((e: any) => e.title === row.title && e.at === row.at);
  if (ev) {
    await api.emergAccept(ev.id);
    await load();
  }
}
async function clearEv(row: any) {
  const ev = (await api.emergEvents({})).find((e: any) => e.title === row.title && e.at === row.at);
  if (ev) {
    await api.emergClear(ev.id);
    await load();
  }
}
async function raise(type: '事件' | '演练') {
  await fetch(`${api.API_BASE}/school/emergency/alerts/raise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, title: type === '事件' ? '后厨报警' : '演练报警', level: '一般' }),
  });
  await load();
}
let es: EventSource | null = null;
onMounted(() => {
  load();
  try {
    es = new EventSource(`${API_BASE}/school/emergency/stream`);
    es.addEventListener('emergency-alert', () => load());
    es.addEventListener('emergency-accepted', () => load());
    es.addEventListener('emergency-cleared', () => load());
  } catch {}
});
onBeforeUnmount(() => {
  es?.close();
});
</script>
