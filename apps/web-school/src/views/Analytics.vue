<template>
  <el-card>
    <template #header>大数据统计看板</template>
    <el-row :gutter="12">
      <el-col :span="6"
        ><el-card
          ><template #header>AI 预警</template>
          <div>8</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>晨检</template>
          <div>16</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>今日入库</template>
          <div>12</div></el-card
        ></el-col
      >
      <el-col :span="6"
        ><el-card
          ><template #header>满意度</template>
          <div>96%</div></el-card
        ></el-col
      >
    </el-row>
    <el-card style="margin-top: 12px">
      <template #header>图表（占位）</template>
      <el-skeleton :rows="6" animated />
      <div style="margin-top: 8px">
        <el-button type="primary" @click="exportPdf">导出 PDF</el-button>
      </div>
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
const exportPdf = () => alert('导出 PDF（演示）');
</script>
