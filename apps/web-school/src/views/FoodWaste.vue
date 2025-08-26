<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食品浪费管理</span>
        <div>
          <el-button @click="onExportCsv">导出明细</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>浪费来源统计</template>
          <el-table :data="stats" size="small" border>
            <el-table-column prop="category" label="类别" />
            <el-table-column prop="amount" label="数量(kg)" width="140" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>明细</template>
          <el-table :data="details" size="small" border>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="category" label="类别" />
            <el-table-column prop="amount" label="数量(kg)" width="140" />
            <el-table-column prop="reason" label="原因" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const stats = ref([
  { category: '库存损耗', amount: 5 },
  { category: '加工损耗', amount: 3 },
  { category: '剩菜剩饭', amount: 4 },
]);
const details = ref([
  { date: new Date().toLocaleDateString(), category: '剩菜剩饭', amount: 2, reason: '学生剩饭' },
]);
const onExportCsv = () =>
  exportCsv('食品浪费明细', details.value as any, {
    date: '日期',
    category: '类别',
    amount: '数量(kg)',
    reason: '原因',
  });
</script>
