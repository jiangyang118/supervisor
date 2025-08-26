<template>
  <el-card>
    <template #header>预警汇总</template>
    <el-row :gutter="12">
      <el-col :span="8"
        ><el-card
          ><template #header>证件</template>
          <div>2</div></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>食材</template>
          <div>1</div></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>行为</template>
          <div>3</div></el-card
        ></el-col
      >
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
const rows = ref([
  {
    id: 'AL-100',
    type: 'AI-未戴帽',
    level: '中',
    status: '未处理',
    at: new Date().toLocaleString(),
  },
]);
</script>
