<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>明厨亮灶监管</span>
        <div>
          <el-button @click="onExportCsv">导出通道列表</el-button>
        </div>
      </div>
    </template>
    <div style="margin-bottom: 8px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
      <el-select
        v-model="schoolId"
        clearable
        filterable
        placeholder="全部学校"
        style="min-width: 220px"
      >
        <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-input v-model="q" placeholder="搜索通道名称" style="width: 240px" clearable />
      <el-button @click="load">查询</el-button>
    </div>
    <el-tabs v-model="tab">
      <el-tab-pane label="实时" name="live">
        <el-table :data="filteredCameras" size="small" border>
          <el-table-column prop="id" label="通道ID" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="school" label="学校" />
          <el-table-column prop="online" label="状态" width="100">
            <template #default="{ row }"
              ><el-tag :type="row.online ? 'success' : 'danger'">{{
                row.online ? '在线' : '离线'
              }}</el-tag></template
            >
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button size="small" @click="preview(row)">预览</el-button>
              <el-button size="small" @click="snapshot(row)">快照</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="回放" name="playback">
        <el-form :inline="true" :model="query">
          <el-form-item label="通道">
            <el-select v-model="query.cameraId" filterable clearable style="min-width: 220px">
              <el-option
                v-for="c in cameras"
                :key="c.id + '@' + c.schoolId"
                :label="c.school + '-' + c.name"
                :value="c.schoolId + '@' + c.id"
              />
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
          <el-table-column label="播放">
            <template #default="{ row }"
              ><a :href="row.hlsUrl" target="_blank">HLS</a> ｜
              <a :href="row.flvUrl" target="_blank">FLV</a></template
            >
          </el-table-column>
        </el-table>
        <el-empty v-else description="无回放片段" />
      </el-tab-pane>
      <el-tab-pane label="快照" name="snapshots">
        <div
          style="margin-bottom: 8px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap"
        >
          <el-select
            v-model="snapQuery.cameraId"
            filterable
            clearable
            placeholder="选择通道"
            style="min-width: 220px"
          >
            <el-option
              v-for="c in cameras"
              :key="c.id + '@' + c.schoolId"
              :label="c.school + '-' + c.name"
              :value="c.schoolId + '@' + c.id"
            />
          </el-select>
          <el-date-picker v-model="snapQuery.range" type="datetimerange" />
          <el-button @click="loadSnaps">查询</el-button>
        </div>
        <el-table :data="snaps" size="small" border>
          <el-table-column prop="id" label="快照ID" width="120" />
          <el-table-column prop="cameraId" label="通道" />
          <el-table-column prop="at" label="时间" width="180" />
          <el-table-column label="图片">
            <template #default="{ row }"
              ><el-image :src="row.url" fit="cover" style="width: 120px; height: 80px"
            /></template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
  <el-dialog v-model="playerVisible" title="实时预览" width="720px">
    <div style="width: 100%; height: 400px">
      <VideoPlayer
        :flv-url="current?.flvUrl"
        :hls-url="current?.hlsUrl"
        :title="(current?.school || '') + '-' + (current?.name || '')"
      />
    </div>
    <template #footer>
      <el-button @click="playerVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import VideoPlayer from '../components/VideoPlayer.vue';
type Cam = {
  id: string;
  name: string;
  schoolId: string;
  school: string;
  online: boolean;
  flvUrl: string;
  hlsUrl: string;
};
const tab = ref('live');
const schools = ref<Array<{ id: string; name: string }>>([]);
const schoolId = ref<string | undefined>(undefined);
const cameras = ref<Cam[]>([]);
const q = ref('');
const filteredCameras = computed(() =>
  cameras.value.filter(
    (c) =>
      (!schoolId.value || c.schoolId === schoolId.value) && (!q.value || c.name.includes(q.value)),
  ),
);
async function load() {
  cameras.value = await api.brightCameras(schoolId.value);
}
const playerVisible = ref(false);
const current = ref<Cam | null>(null);
function preview(row: Cam) {
  current.value = row;
  playerVisible.value = true;
}
async function snapshot(row: Cam) {
  const rec = await api.brightCreateSnapshot({ schoolId: row.schoolId, cameraId: row.id });
  snaps.value.unshift(rec);
}
const query = ref<{ cameraId?: string; range: [Date, Date] | null }>({
  cameraId: undefined,
  range: null,
});
const segments = ref<any[]>([]);
async function search() {
  if (!query.value.cameraId) {
    segments.value = [];
    return;
  }
  const [sid, cid] = String(query.value.cameraId).split('@');
  const params: any = {};
  if (query.value.range && query.value.range.length === 2) {
    params.start = query.value.range[0].toISOString();
    params.end = query.value.range[1].toISOString();
  }
  segments.value = await api.brightPlayback(sid, cid, params.start, params.end);
}
const snaps = ref<any[]>([]);
const snapQuery = ref<{ cameraId?: string; range: [Date, Date] | null }>({
  cameraId: undefined,
  range: null,
});
async function loadSnaps() {
  const params: any = {};
  if (schoolId.value) params.schoolId = schoolId.value;
  if (snapQuery.value.cameraId) {
    const [sid, cid] = String(snapQuery.value.cameraId).split('@');
    params.schoolId = sid;
    params.cameraId = cid;
  }
  if (snapQuery.value.range && snapQuery.value.range.length === 2) {
    params.start = snapQuery.value.range[0].toISOString();
    params.end = snapQuery.value.range[1].toISOString();
  }
  snaps.value = await api.brightSnapshots(params);
}
const onExportCsv = () =>
  exportCsv('通道列表', filteredCameras.value as any, {
    id: '通道ID',
    name: '名称',
    school: '学校',
  });
onMounted(async () => {
  schools.value = await api.schools();
  await load();
  await loadSnaps();
});
</script>
