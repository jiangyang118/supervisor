<template>
  <el-card>
    <div
      style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px"
    >
      <h3 style="margin: 0">{{ title }}</h3>
      <div>
        <el-button
          v-if="actions && actions.includes('create')"
          type="primary"
          @click="$emit('create')"
          >新建</el-button
        >
        <el-button v-if="actions && actions.includes('export-csv')" @click="onExport('csv')"
          >导出 CSV</el-button
        >
        <el-button v-if="actions && actions.includes('export-pdf')" @click="onExport('pdf')"
          >导出 PDF</el-button
        >
      </div>
    </div>
    <slot name="filters">
      <el-row :gutter="8" style="margin-bottom: 8px">
        <el-col :span="6"><el-input v-model="q" placeholder="关键词搜索" clearable /></el-col>
        <el-col :span="6"
          ><el-date-picker
            v-model="range"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
        /></el-col>
        <el-col :span="6"><el-button @click="refresh">查询</el-button></el-col>
      </el-row>
    </slot>
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" :label="mainCol" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="date" label="时间" width="180" />
    </el-table>
    <el-empty v-if="!rows.length" description="暂无数据，演示占位" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    mainCol?: string;
    actions?: Array<'create' | 'export-csv' | 'export-pdf'>;
  }>(),
  {
    actions: () => [],
    mainCol: '名称',
  },
);
const q = ref('');
const range = ref<[Date, Date] | null>(null);
const rows = ref<any[]>([]);
const mainCol = props.mainCol;

const onExport = (type: 'csv' | 'pdf') => {
  // 仅演示：弹出导出提示
  const map = { csv: 'CSV', pdf: 'PDF' } as const;
  // eslint-disable-next-line no-alert
  alert(`已触发导出 ${map[type]}（演示占位）`);
};
const refresh = () => {
  // 仅演示：填充几行假数据
  rows.value = [1, 2, 3].map((i) => ({
    id: `${Date.now()}-${i}`,
    name: `${props.title} 示例 ${i}`,
    status: i % 2 ? '正常' : '异常',
    date: new Date().toLocaleString(),
  }));
};

watchEffect(() => {
  void q.value;
  void range.value; // 占位，触发依赖
});
</script>
