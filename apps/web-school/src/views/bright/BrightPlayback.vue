<template>
  <el-card>
    <template #header>明厨亮灶 - 回放</template>
    <el-form :inline="true" :model="query">
      <el-form-item label="通道">
        <el-select v-model="query.cameraId" filterable clearable style="min-width: 220px">
          <el-option v-for="c in cameras" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间"
        ><el-date-picker v-model="query.range" type="datetimerange"
      /></el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-table v-if="segments.length" :data="segments" size="small" border>
      <el-table-column prop="start" label="开始" width="180" />
      <el-table-column prop="end" label="结束" width="180" />
      <el-table-column label="播放"
        ><template #default="{ row }"
          ><a :href="row.hlsUrl" target="_blank">HLS</a></template
        ></el-table-column
      >
    </el-table>
    <el-empty v-else description="无回放片段" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../../services/api';
import { getCurrentSchoolId } from '../../utils/school';
type Cam = { id: string; name: string };
const cameras = ref<Cam[]>([]);
const segments = ref<any[]>([]);
const query = ref<{ cameraId?: string; range: [Date, Date] | null }>({
  cameraId: undefined,
  range: null,
});
async function search() {
  if (!query.value.cameraId) {
    segments.value = [];
    return;
  }
  const params: any = {};
  if (query.value.range && query.value.range.length === 2) {
    params.start = query.value.range[0].toISOString();
    params.end = query.value.range[1].toISOString();
  }
  segments.value = await api.brightPlayback(
    getCurrentSchoolId(),
    query.value.cameraId!,
    params.start,
    params.end,
  );
}
let off: any = null;
onMounted(async () => {
  cameras.value = (await api.brightCameras(getCurrentSchoolId())).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const h = async () => {
    cameras.value = (await api.brightCameras(getCurrentSchoolId())).map((c) => ({
      id: c.id,
      name: c.name,
    }));
    segments.value = [];
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
