<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食品浪费监管</span>
        <div>
          <el-button @click="onExportCsv">导出明细</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>学校排行</template>
          <el-table :data="ranking" size="small" border>
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="amount" label="浪费(kg)" width="140" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>明细</template>
          <el-table :data="details" size="small" border>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="category" label="类别" />
            <el-table-column prop="amount" label="数量(kg)" width="140" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const ranking = ref([
  { school: '示例二小', amount: 35 },
  { school: '示例一中', amount: 20 },
]);
const details = ref([
  { date: new Date().toLocaleDateString(), school: '示例二小', category: '餐厨垃圾', amount: 12 },
]);
const onExportCsv = () =>
  exportCsv('食品浪费明细', details.value as any, {
    date: '日期',
    school: '学校',
    category: '类别',
    amount: '数量(kg)',
  });
</script>
