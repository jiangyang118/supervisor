<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>预警汇总</span>
        <div>
          <el-button @click="onExportCsv">导出</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card
          ><template #header>汇总</template>
          <el-tag type="danger">高：2</el-tag>
          <el-tag type="warning" style="margin-left: 8px">中：5</el-tag>
          <el-tag type="info" style="margin-left: 8px">低：9</el-tag>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card
          ><template #header>接收配置（占位）</template>
          <el-switch v-model="sms" active-text="短信" />
          <el-switch v-model="inbox" active-text="站内" style="margin-left: 12px" />
        </el-card>
      </el-col>
    </el-row>
    <el-card style="margin-top: 12px">
      <template #header>预警明细</template>
      <el-table :data="rows" size="small" border>
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="level" label="等级" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="at" label="时间" width="180" />
      </el-table>
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const sms = ref(true);
const inbox = ref(true);
const rows = ref([
  {
    id: 'AL-001',
    type: 'AI-未戴帽',
    level: '高',
    status: '未处理',
    at: new Date().toLocaleString(),
  },
]);
const onExportCsv = () =>
  exportCsv('预警汇总', rows.value as any, {
    id: 'ID',
    type: '类型',
    level: '等级',
    status: '状态',
    at: '时间',
  });
</script>
