<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>数据看版</span>
        <div>
          <el-button @click="exportPdf">导出 PDF（占位）</el-button>
        </div>
      </div>
    </template>
    <el-row :gutter="12">
      <el-col :span="6"
        ><el-card
          ><template #header>学校</template>
          <div>12 所</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>AI 预警</template>
          <div>24 条</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>今日上报</template>
          <div>86 条</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>满意度</template>
          <div>94%</div></el-card
        ></el-col
      >
    </el-row>
    <el-card style="margin-top: 12px">
      <template #header>图表（占位）</template>
      <el-skeleton :rows="6" animated />
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
const exportPdf = () => alert('导出 PDF（演示）');
</script>
