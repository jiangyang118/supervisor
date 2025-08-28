<template>
  <el-card>
    <template #header>明厨亮灶 - 实时视频</template>
    <el-table :data="cameras" size="small" border>
      <el-table-column prop="id" label="通道ID" width="120" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="preview(row)">预览</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="playerVisible" title="实时预览" width="720px">
    <div style="width: 100%; height: 400px">
      <VideoPlayer :hls-url="current?.hlsUrl" :title="current?.name" />
    </div>
    <template #footer><el-button @click="playerVisible = false">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../../services/api';
import { getCurrentSchoolId } from '../../utils/school';
import VideoPlayer from '../../components/VideoPlayer.vue';
type Cam = { id: string; name: string; hlsUrl: string };
const cameras = ref<Cam[]>([]);
const playerVisible = ref(false);
const current = ref<Cam | null>(null);
function preview(row: Cam) {
  current.value = row;
  playerVisible.value = true;
}
let off: any = null;
onMounted(async () => {
  cameras.value = await api.brightCameras(getCurrentSchoolId());
  const h = async () => {
    cameras.value = await api.brightCameras(getCurrentSchoolId());
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
