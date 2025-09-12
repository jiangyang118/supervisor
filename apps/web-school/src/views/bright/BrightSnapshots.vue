<template>
  <el-card>
    <template #header>明厨亮灶 - 快照留存</template>
    <div style="margin-bottom: 8px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
      <el-select
        v-model="cameraId"
        filterable
        clearable
        placeholder="选择通道"
        style="min-width: 220px"
      >
        <el-option v-for="c in cameras" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-date-picker v-model="range" type="datetimerange" />
      <el-button @click="load">查询</el-button>
    </div>
    <el-table :data="snaps"  border>
      <el-table-column prop="id" label="快照ID" width="120" />
      <el-table-column prop="cameraId" label="通道" />
      <el-table-column label="日期" width="140">
        <template #default="{ row }">{{ dateOnly(row.at) }}</template>
      </el-table-column>
      <el-table-column label="图片">
        <template #default="{ row }"
          ><el-image :src="row.url" fit="cover" style="width: 120px; height: 80px"
        /></template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../../services/api';
import { dateOnly } from '../../utils/datetime';
import { getCurrentSchoolId } from '../../utils/school';
const snaps = ref<any[]>([]);
const cameras = ref<Array<{ id: string; name: string }>>([]);
const cameraId = ref<string | undefined>(undefined);
const range = ref<[Date, Date] | null>(null);
async function load() {
  const params: any = { schoolId: getCurrentSchoolId() };
  if (cameraId.value) params.cameraId = cameraId.value;
  if (range.value && range.value.length === 2) {
    params.start = range.value[0].toISOString();
    params.end = range.value[1].toISOString();
  }
  snaps.value = await api.brightSnapshots(params);
}
let off: any = null;
onMounted(async () => {
  cameras.value = (await api.brightCameras(getCurrentSchoolId())).map((c: any) => ({
    id: c.id,
    name: c.name,
  }));
  await load();
  const h = async () => {
    cameras.value = (await api.brightCameras(getCurrentSchoolId())).map((c: any) => ({
      id: c.id,
      name: c.name,
    }));
    await load();
  };
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  try {
    off?.();
  } catch {}
});
</script>
