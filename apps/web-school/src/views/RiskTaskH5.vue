<template>
  <div style="padding: 12px">
    <h3>排查任务</h3>
    <el-descriptions v-if="task" :column="1" size="small" border>
      <el-descriptions-item label="任务ID">{{ task.id }}</el-descriptions-item>
      <el-descriptions-item label="检查人员">{{ task.assignee }}</el-descriptions-item>
      <el-descriptions-item label="地点">{{ task.location }}</el-descriptions-item>
      <el-descriptions-item label="对象">{{ task.object }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ task.note || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ task.status }}</el-descriptions-item>
    </el-descriptions>
    <div style="margin-top: 12px">
      <el-input v-model="result" type="textarea" :rows="4" placeholder="请输入整改结果" />
      <div style="margin-top: 8px">
        <el-button type="primary" :disabled="!result" @click="submit">提交整改结果</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../services/api';
const route = useRoute();
const task = ref<any>(null);
const result = ref('');
async function load() {
  const id = String(route.params.id || '');
  task.value = await api.riskTaskDetail(id);
}
async function submit() {
  if (!task.value) return;
  await api.riskTaskSubmit(task.value.id, result.value);
  await load();
  result.value = '';
}
onMounted(load);
</script>
