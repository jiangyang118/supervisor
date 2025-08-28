<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; gap: 12px">
        <span>食安指数</span>
        <el-input v-model="schoolId" placeholder="学校ID（可选）" style="width: 220px" clearable />
        <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <el-row :gutter="12">
      <el-col :span="6">
        <el-statistic title="综合得分" :value="score" />
      </el-col>
      <el-col :span="18">
        <el-table :data="submetrics" size="small" border>
          <el-table-column prop="metric" label="指标" />
          <el-table-column prop="value" label="分数" width="120" />
        </el-table>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';

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
