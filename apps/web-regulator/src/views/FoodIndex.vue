<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食安指数</span>
        <div>
          <el-button @click="onExportCsv">导出排行</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>指数排行</template>
          <el-table :data="ranking" size="small" border>
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="score" label="分数" width="120" />
            <el-table-column prop="level" label="等级" width="120" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>指标配置（占位）</template>
          <el-form label-width="96px">
            <el-form-item label="AI 行为权重"
              ><el-input-number v-model="weights.ai" :min="0" :max="100"
            /></el-form-item>
            <el-form-item label="上报权重"
              ><el-input-number v-model="weights.reports" :min="0" :max="100"
            /></el-form-item>
            <el-form-item label="满意度权重"
              ><el-input-number v-model="weights.satisfaction" :min="0" :max="100"
            /></el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const ranking = ref([
  { school: '示例一中', score: 95, level: 'A' },
  { school: '示例二小', score: 90, level: 'A' },
]);
const weights = ref({ ai: 40, reports: 30, satisfaction: 30 });
const onExportCsv = () =>
  exportCsv('食安指数排行', ranking.value as any, { school: '学校', score: '分数', level: '等级' });
</script>
