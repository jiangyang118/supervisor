<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>AI 抓拍统计</span>
        <div>
          <el-button @click="onExportCsv">导出统计</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="维度">
        <el-select v-model="filters.dim">
          <el-option label="日" value="day" /><el-option label="周" value="week" /><el-option
            label="月"
            value="month"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="时间"
        ><el-date-picker v-model="filters.range" type="daterange"
      /></el-form-item>
      <el-form-item><el-button @click="query">统计</el-button></el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="count" label="数量" width="120" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const filters = ref<{ dim: 'day' | 'week' | 'month'; range: [Date, Date] | null }>({
  dim: 'day',
  range: null,
});
const rows = ref([
  { type: '未戴帽', count: 8 },
  { type: '打电话', count: 5 },
]);
const query = () => {
  /* 演示占位 */
};
const onExportCsv = () =>
  exportCsv('AI抓拍统计', rows.value as any, { type: '类型', count: '数量' });
</script>
