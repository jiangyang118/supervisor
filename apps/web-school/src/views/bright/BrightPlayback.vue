<template>
  <el-card>
    <template #header>视频回放</template>
    <el-form :inline="true" :model="query">
      <el-form-item label="通道">
        <el-select v-model="query.cameraId" filterable clearable style="min-width: 220px">
          <el-option v-for="c in cameras" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间"
        ><el-date-picker v-model="query.range" type="datetimerange"
          placeholder="选择时间"
          unlink-panels
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          range-separator="至"
      /></el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-table v-if="segments.length" :data="segments"  border>
      <el-table-column prop="start" label="开始" width="180" />
      <el-table-column prop="end" label="结束" width="180" />
      <el-table-column label="播放">
        <template #default="{ row }">
          <a v-if="row.hlsUrl" :href="row.hlsUrl" target="_blank">HLS</a>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="下载" width="120">
        <template #default="{ row }">
          <el-button  @click="downloadSeg(row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="无回放片段" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
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
    ElMessage.warning('请选择通道');
    return;
  }
  try {
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
    if (!segments.value?.length) ElMessage.info('未查询到回放片段');
  } catch (e: any) {
    ElMessage.error(`查询失败: ${e?.message || e}`);
  }
}

async function downloadSeg(row: any) {
  if (!query.value.cameraId) { ElMessage.warning('请选择通道'); return; }
  try {
    const list = await api.brightDownload(
      getCurrentSchoolId(),
      query.value.cameraId!,
      row.start,
      row.end,
    );
    const url = list && list[0];
    if (url) {
      window.open(url, '_blank');
    } else {
      ElMessage.info('无可下载链接');
    }
  } catch (e: any) {
    ElMessage.error(`获取下载链接失败: ${e?.message || e}`);
  }
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
