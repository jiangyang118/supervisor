<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <h3>今日待办</h3>
          <ul>
            <li>晨检</li>
            <li>消毒</li>
            <li>留样</li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <h3>AI 预警（示例）</h3>
          <p>未戴口罩：0 | 未戴帽：0 | 吸烟：0</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts"></script>

