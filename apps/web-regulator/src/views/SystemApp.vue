<template>
  <el-card>
    <template #header>APP 下载</template>
    <el-row :gutter="12">
      <el-col :span="8">
        <el-card>
          <template #header>Android</template>
          <a :href="android?.url" target="_blank"><el-button type="primary">下载 APK</el-button></a>
          <div style="margin-top: 8px">版本：{{ android?.version || '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>iOS</template>
          <a :href="ios?.url" target="_blank"><el-button type="primary">App Store</el-button></a>
          <div style="margin-top: 8px">版本：{{ ios?.version || '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>说明</template>
          <div>使用手机扫码或点击上方按钮下载 APP。</div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const apps = ref<any[]>([]);
const android = ref<any>(null);
const ios = ref<any>(null);
onMounted(async () => {
  apps.value = await api.sysApps();
  android.value = apps.value.find((a) => a.platform === 'Android');
  ios.value = apps.value.find((a) => a.platform === 'iOS');
});
</script>
