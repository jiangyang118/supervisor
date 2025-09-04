<template>
  <el-card>
    <template #header>预警概览</template>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>预警汇总</template>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
            <el-input v-model="schoolId" placeholder="学校ID（可选）" style="width: 220px" clearable />
            <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
          </div>
          <el-row :gutter="8" style="margin-bottom:8px">
            <el-col v-for="s in summary" :key="s.name" :span="8">
              <el-statistic :title="s.name" :value="s.count" />
            </el-col>
          </el-row>
          <el-table :data="warnRows" size="small" border>
            <el-table-column prop="id" label="ID" width="120" />
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="level" label="等级" width="120" />
            <el-table-column prop="status" label="状态" width="120" />
            <el-table-column prop="at" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>食安指数</template>
          <div style="display:flex;gap:12px;align-items:center">
            <el-input v-model="schoolId" placeholder="学校ID（可选）" style="width: 220px" clearable />
            <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
          </div>
          <el-row :gutter="12" style="margin-top:8px">
            <el-col :span="8">
              <el-statistic title="综合得分" :value="score" />
            </el-col>
            <el-col :span="16">
              <el-table :data="submetrics" size="small" border>
                <el-table-column prop="metric" label="指标" />
                <el-table-column prop="value" label="分数" width="120" />
              </el-table>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
const warnRows = ref<Array<{ id: string; type: string; level: string; status: string; at: string }>>([]);
const summary = ref<Array<{ name: string; count: number }>>([]);
const loading = ref(false);
const schoolId = ref<string | undefined>(getCurrentSchoolId());
const score = ref(0);
const submetrics = ref<Array<{ metric: string; value: number }>>([]);
async function load() {
  loading.value = true;
  try {
    const [alerts, idx] = await Promise.all([
      api.analyticsAlerts(schoolId.value),
      api.analyticsFoodIndex(schoolId.value),
    ]);
    warnRows.value = alerts.items || [];
    summary.value = alerts.summary || [];
    score.value = idx.score;
    submetrics.value = idx.submetrics;
  } finally {
    loading.value = false;
  }
}
onMounted(() => {
  load();
  const h = () => { schoolId.value = getCurrentSchoolId(); load(); };
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
});
</script>
