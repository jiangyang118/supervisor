<template>
  <div style="background:#0b1b2b;color:#cde7ff;height:calc(100vh - 60px);padding:12px;">
    <div style="display:grid;grid-template-columns:2fr 1fr;grid-gap:12px;height:100%;">
      <div style="display:grid;grid-template-rows:1fr 1fr;grid-gap:12px;">
        <el-card shadow="always" style="background:#10263d;color:#cde7ff;">
          <template #header><span>摄像头轮巡</span></template>
          <div style="height:240px;display:flex;align-items:center;justify-content:center;background:#0a1a2a;border-radius:4px;">视频轮巡占位</div>
        </el-card>
        <el-card shadow="always" style="background:#10263d;color:#cde7ff;">
          <template #header><span>今日上报进度</span></template>
          <el-progress :percentage="76" status="success" />
          <div style="margin-top:8px;display:flex;gap:12px;">
            <div>晨检：已完成</div>
            <div>消毒：进行中</div>
            <div>留样：未开始</div>
          </div>
        </el-card>
      </div>
      <div style="display:grid;grid-template-rows:1fr 1fr;grid-gap:12px;">
        <el-card shadow="always" style="background:#10263d;color:#cde7ff;">
          <template #header><span>预警</span></template>
          <el-tag type="danger" style="margin-right:8px;">高：2</el-tag>
          <el-tag type="warning" style="margin-right:8px;">中：5</el-tag>
          <el-tag type="info">低：9</el-tag>
        </el-card>
        <el-card shadow="always" style="background:#10263d;color:#cde7ff;">
          <template #header><span>AI 抓拍榜单</span></template>
          <ol>
            <li>未戴帽：12</li>
            <li>未戴口罩：8</li>
            <li>打电话：5</li>
          </ol>
        </el-card>
      </div>
    </div>
    <el-card shadow="always" style="margin-top:12px;background:#10263d;color:#cde7ff;">
      <template #header><span>学校对比</span></template>
      <div style="display:flex;gap:16px;">
        <div>示例一中：预警 3，满意度 96%</div>
        <div>示例二小：预警 5，满意度 91%</div>
        <div>示例三幼：预警 1，满意度 98%</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts"></script>

