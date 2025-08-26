<template>
  <el-card>
    <div
      style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px"
    >
      <h3 style="margin: 0">{{ title }}</h3>
      <div>
        <el-button v-if="actions.includes('create')" type="primary">新建</el-button>
        <el-button v-if="actions.includes('export-csv')">导出 CSV</el-button>
        <el-button v-if="actions.includes('export-pdf')">导出 PDF</el-button>
      </div>
    </div>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" :label="mainCol" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="date" label="时间" width="180" />
    </el-table>
    <el-empty v-if="!rows.length" description="暂无数据，演示占位" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
const props = defineProps<{ title: string; mainCol?: string; actions?: string[] }>();
const mainCol = props.mainCol ?? '名称';
const actions = props.actions ?? ['export-csv', 'export-pdf'];
const rows = ref<Record<string, unknown>[]>([]);
onMounted(() => {
  rows.value = [1, 2, 3].map((i) => ({
    id: `${Date.now()}-${i}`,
    name: `${props.title} 示例 ${i}`,
    status: i % 2 ? '正常' : '异常',
    date: new Date().toLocaleString(),
  }));
});
</script>
