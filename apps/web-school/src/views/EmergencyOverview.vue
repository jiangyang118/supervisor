<template>
  <el-card>
    <template #header>应急管理 - 概览</template>
    <el-row :gutter="12">
      <el-col :span="8"
        ><el-card
          ><template #header>事件</template>
          <div>2</div></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>演练</template>
          <div>1</div></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>会议提醒</template>
          <div>0</div></el-card
        ></el-col
      >
    </el-row>
    <el-divider />
    <el-button type="primary">快捷接警</el-button>
    <el-button type="warning" style="margin-left: 8px">启动预案</el-button>
  </el-card>
</template>

<script setup lang="ts"></script>
