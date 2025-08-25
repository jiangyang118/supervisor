<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <h3>学校基础数据</h3>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="学校">示例中学</el-descriptions-item>
            <el-descriptions-item label="食堂">1 号食堂</el-descriptions-item>
            <el-descriptions-item label="地址">示例路 123 号</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <h3>今日待办</h3>
          <el-timeline>
            <el-timeline-item v-for="t in todos" :key="t" :timestamp="''">{{ t }}</el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <h3>AI 预警</h3>
          <el-tag type="danger" style="margin-right:8px;">未戴口罩：0</el-tag>
          <el-tag type="warning" style="margin-right:8px;">未戴帽：0</el-tag>
          <el-tag type="info">吸烟：0</el-tag>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:12px;">
      <el-col :span="12">
        <el-card>
          <h3>入库/出库</h3>
          <el-skeleton :rows="3" animated />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <h3>卫生上报与设备信息</h3>
          <el-skeleton :rows="3" animated />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:12px;">
      <el-col :span="12">
        <el-card>
          <h3>家长分析（满意度/评价）</h3>
          <el-skeleton :rows="3" animated />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <h3>每日报表快速导出</h3>
          <el-button type="primary" @click="exportPdf">导出 PDF</el-button>
          <el-button @click="exportCsv">导出 CSV</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
  </template>

<script setup lang="ts">
const todos = ['晨检', '消毒', '留样', '陪餐', '废弃物处理', '卫生检查'];
const exportPdf = () => alert('导出 PDF（演示）');
const exportCsv = () => alert('导出 CSV（演示）');
</script>
