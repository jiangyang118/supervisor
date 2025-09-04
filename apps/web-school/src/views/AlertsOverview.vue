<template>
  <el-card>
    <template #header>预警概览</template>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>预警汇总</template>
          <el-row :gutter="8" style="margin-bottom:8px">
            <el-col :span="8"><el-statistic title="证件" :value="2" /></el-col>
            <el-col :span="8"><el-statistic title="食材" :value="1" /></el-col>
            <el-col :span="8"><el-statistic title="行为" :value="3" /></el-col>
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
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const warnRows = ref([
  { id: 'AL-100', type: 'AI-未戴帽', level: '中', status: '未处理', at: new Date().toLocaleString() },
]);
const loading = ref(false);
const schoolId = ref<string | undefined>();
const score = ref(0);
const submetrics = ref<Array<{ metric: string; value: number }>>([]);
async function load() {
  loading.value = true;
  try {
    const data = await api.analyticsFoodIndex(schoolId.value);
    score.value = data.score;
    submetrics.value = data.submetrics;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

