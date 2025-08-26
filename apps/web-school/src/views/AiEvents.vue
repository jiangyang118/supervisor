<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>智能检查/AI 预警 - 违规抓拍明细</span>
        <div>
          <el-button @click="onExportCsv">导出</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="camera" label="摄像头/通道" />
      <el-table-column prop="snapshot" label="快照" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-input
            v-model="row.measure"
            placeholder="处理措施"
            style="width: 160px; margin-right: 6px"
          />
          <el-button size="small" @click="handle(row)">处置</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
type Row = {
  id: string;
  type: string;
  camera: string;
  snapshot: string;
  at: string;
  measure?: string;
};
const rows = ref<Row[]>([
  {
    id: 'AI-001',
    type: '未戴帽',
    camera: '1# 后厨-操作台',
    snapshot: 'snap://001',
    at: new Date().toLocaleString(),
  },
  {
    id: 'AI-002',
    type: '打电话',
    camera: '1# 后厨-清洗区',
    snapshot: 'snap://002',
    at: new Date().toLocaleString(),
  },
]);
const handle = (r: Row) => {
  alert(`已记录处置措施：${r.measure || '无'}`);
};
const onExportCsv = () =>
  exportCsv('AI违规抓拍', rows.value, {
    id: 'ID',
    type: '类型',
    camera: '通道',
    snapshot: '快照',
    at: '时间',
    measure: '处置',
  });
</script>
