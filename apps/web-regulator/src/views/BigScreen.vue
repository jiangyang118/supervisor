<template>
  <div
    style="
      background: #0b1b2b;
      color: #cde7ff;
      height: calc(100vh - 60px);
      padding: 12px;
      display: flex;
      gap: 12px;
    "
  >
    <!-- 左侧学校列表 -->
    <div style="width: 260px; display: flex; flex-direction: column; gap: 8px">
      <el-input v-model="q" placeholder="搜索学校" clearable size="small" />
      <el-card shadow="never" style="background: #10263d; color: #cde7ff; flex: 1; overflow: auto">
        <template #header><span>学校列表</span></template>
        <el-menu
          :default-active="activeSchoolId"
          style="
            --el-menu-bg-color: #10263d;
            --el-menu-text-color: #cde7ff;
            --el-menu-active-color: #67c23a;
          "
          @select="onSelectSchool"
        >
          <el-menu-item v-for="s in filteredSchools" :key="s.id" :index="s.id">{{
            s.name
          }}</el-menu-item>
        </el-menu>
      </el-card>
    </div>

    <!-- 中间视频轮巡 + 右侧信息 -->
    <div style="flex: 1; display: grid; grid-template-columns: 2fr 1fr; gap: 12px">
      <div style="display: grid; grid-template-rows: 1fr 1fr; gap: 12px">
        <el-card shadow="always" style="background: #10263d; color: #cde7ff">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>摄像头轮巡（{{ currentSchool?.name || '未选择' }}）</span>
              <div>
                <el-select v-model="grid" size="small" style="width: 100px; margin-right: 8px">
                  <el-option :value="1" label="1x1" />
                  <el-option :value="4" label="2x2" />
                  <el-option :value="9" label="3x3" />
                </el-select>
                <el-button size="small" @click="toggleFull">全屏</el-button>
                <el-button size="small" @click="prev">上一批</el-button>
                <el-button size="small" @click="next">下一批</el-button>
              </div>
            </div>
          </template>
          <div :style="gridStyle">
            <template v-if="players.length">
              <div v-for="p in players" :key="p.id" class="cell">
                <VideoPlayer
                  :flv-url="(p as any).flvUrl"
                  :hls-url="(p as any).hlsUrl"
                  :title="p.name"
                />
              </div>
            </template>
            <div
              v-else
              style="height: 100%; display: flex; align-items: center; justify-content: center"
            >
              请选择左侧学校
            </div>
          </div>
        </el-card>
        <el-card shadow="always" style="background: #10263d; color: #cde7ff">
          <template #header><span>今日上报进度</span></template>
          <el-progress :percentage="progress" status="success" />
          <div style="margin-top: 8px; display: flex; gap: 12px">
            <div>晨检：{{ Math.round(progress * 0.3) }}%</div>
            <div>消毒：{{ Math.round(progress * 0.4) }}%</div>
            <div>留样：{{ Math.round(progress * 0.3) }}%</div>
          </div>
        </el-card>
      </div>
      <div style="display: grid; grid-template-rows: 1fr 1fr; gap: 12px">
        <el-card shadow="always" style="background: #10263d; color: #cde7ff">
          <template #header><span>预警统计</span></template>
          <el-tag type="danger" style="margin-right: 8px">高：{{ warn.high }}</el-tag>
          <el-tag type="warning" style="margin-right: 8px">中：{{ warn.mid }}</el-tag>
          <el-tag type="info">低：{{ warn.low }}</el-tag>
        </el-card>
        <el-card shadow="always" style="background: #10263d; color: #cde7ff">
          <template #header><span>AI 抓拍榜单</span></template>
          <ol>
            <li v-for="i in aiTop" :key="i.type">{{ i.type }}：{{ i.count }}</li>
          </ol>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from '../services/api';
import VideoPlayer from '../components/VideoPlayer.vue';

type School = { id: string; name: string };
type Cam = { id: string; name: string; school: string; snapshotUrl?: string | null };

const schools = ref<School[]>([]);
const q = ref('');
const filteredSchools = computed(() => schools.value.filter((s) => s.name.includes(q.value)));
const activeSchoolId = ref('');
const currentSchool = computed(() => schools.value.find((s) => s.id === activeSchoolId.value));

const cams = ref<Cam[]>([]);
const idx = ref(0);
const grid = ref(1);
const players = computed(() => {
  if (!cams.value.length) return [] as Cam[];
  const n = Math.max(1, grid.value);
  const out: Cam[] = [];
  for (let i = 0; i < n; i++) out.push(cams.value[(idx.value + i) % cams.value.length]);
  return out;
});
const gridStyle = computed(() => ({
  height: '260px',
  background: '#0a1a2a',
  borderRadius: '4px',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: grid.value === 1 ? '1fr' : grid.value === 4 ? '1fr 1fr' : '1fr 1fr 1fr',
  gridTemplateRows: grid.value === 1 ? '1fr' : grid.value === 4 ? '1fr 1fr' : '1fr 1fr 1fr',
  gap: '2px',
}));
let timer: any;
function startLoop() {
  stopLoop();
  timer = setInterval(() => {
    next();
  }, 5000);
}
function stopLoop() {
  if (timer) clearInterval(timer);
}
function next() {
  if (cams.value.length) {
    idx.value = (idx.value + Math.max(1, grid.value)) % cams.value.length;
  }
}
function prev() {
  if (cams.value.length) {
    idx.value = (idx.value - Math.max(1, grid.value) + cams.value.length) % cams.value.length;
  }
}
function toggleFull() {
  const el = document.documentElement as any;
  if (!document.fullscreenElement) el.requestFullscreen && el.requestFullscreen();
  else document.exitFullscreen && document.exitFullscreen();
}

const progress = ref(76);
const warn = ref({ high: 2, mid: 5, low: 9 });
const aiTop = ref([
  { type: '未戴帽', count: 12 },
  { type: '未戴口罩', count: 8 },
  { type: '打电话', count: 5 },
]);

async function loadSchools() {
  try {
    schools.value = await api.schools();
    if (schools.value.length) {
      onSelectSchool(schools.value[0].id);
    }
  } catch {
    schools.value = [
     
    ];
    onSelectSchool(0);
  }
}
async function loadCams(schoolId: string) {
  try {
    cams.value = await api.cameras(schoolId);
    idx.value = 0;
    startLoop();
  } catch {
    cams.value = [
      { id: 'ch-01', name: '后厨-操作台', school: '示例一中' },
      { id: 'ch-02', name: '后厨-清洗区', school: '示例一中' },
    ] as any;
    idx.value = 0;
    startLoop();
  }
}
function onSelectSchool(id: string) {
  activeSchoolId.value = id;
  loadCams(id);
}

onMounted(() => {
  loadSchools();
  startLoop();
});
onUnmounted(() => stopLoop());
</script>
<style scoped>
.cell {
  position: relative;
}
</style>
