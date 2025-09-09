<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>远程喊话</span>
        <div>
          <el-button type="primary" @click="send">发送语音</el-button>
        </div>
      </div>
    </template>
    <el-form :model="form" label-width="96px" style="max-width: 640px">
      <el-form-item label="学校"><el-input v-model="form.school" /></el-form-item>
      <el-form-item label="摄像头"><el-input v-model="form.camera" /></el-form-item>
      <el-form-item label="文字内容"><el-input v-model="form.text" type="textarea" /></el-form-item>
      <el-form-item label="TTS 声音">
        <el-select v-model="form.voice"
          ><el-option label="女声" value="female" /><el-option label="男声" value="male"
        /></el-select>
      </el-form-item>
    </el-form>
    <el-divider>发送记录</el-divider>
    <el-table :data="records" size="small" border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="camera" label="摄像头" />
      <el-table-column prop="text" label="内容" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { api } from '../services/api';
type Rec = { id: string; school: string; camera: string; text: string; status: string; at: string };
const form = reactive({
  school: '',
  camera: '',
  text: '请立刻佩戴好口罩和帽子，注意卫生规范。',
  voice: 'female',
});
const records = ref<Rec[]>([]);
const send = async () => {
  const rec = await api.aiBroadcast({ school: form.school, camera: form.camera, text: form.text });
  records.value.unshift(rec);
};
onMounted(async () => {
  records.value = await api.aiBroadcastLogs();
});
</script>
