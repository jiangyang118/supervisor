<template>
  <el-card>
    <template #header>APP 下载</template>
    <p>学校端移动 APP 下载（演示占位）</p>
    <el-row :gutter="12">
      <el-col :span="8"
        ><el-card
          ><template #header>Android</template
          ><el-button type="primary">下载 APK</el-button></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>iOS</template><el-button type="primary">App Store</el-button></el-card
        ></el-col
      >
      <el-col :span="8"
        ><el-card
          ><template #header>版本</template>
          <div>v0.1.0</div></el-card
        ></el-col
      >
    </el-row>
  </el-card>
</template>

<script setup lang="ts"></script>
