<template>
  <el-card>
    <template #header>指挥调度（视频会议/任务）</template>
    <el-form :inline="true" :model="form">
      <el-form-item label="会议主题"><el-input v-model="form.topic" /></el-form-item>
      <el-form-item label="场景"
        ><el-select v-model="form.scene" style="width: 120px"
          ><el-option label="事件" value="事件" /><el-option label="演练" value="演练" /></el-select
      ></el-form-item>
      <el-form-item><el-button type="primary" @click="start">发起会议</el-button></el-form-item>
    </el-form>
    <el-divider />
    <el-card>
      <template #header>会议</template>
      <el-table :data="meetings" size="small" border>
        <el-table-column prop="id" label="会议ID" width="140" />
        <el-table-column prop="title" label="名称" />
        <el-table-column prop="scene" label="场景" width="100" />
        <el-table-column prop="startedAt" label="开始时间" width="180" />
        <el-table-column label="控制" width="260">
          <template #default="{ row }">
            <el-switch
              :model-value="row.micOn"
              active-text="麦克风"
              @change="(v: boolean) => setMeeting(row, { micOn: v })"
            />
            <el-switch
              :model-value="row.camOn"
              active-text="摄像头"
              style="margin-left: 8px"
              @change="(v: boolean) => setMeeting(row, { camOn: v })"
            />
            <el-switch
              :model-value="row.sharing"
              active-text="共享"
              style="margin-left: 8px"
              @change="(v: boolean) => setMeeting(row, { sharing: v })"
            />
          </template>
        </el-table-column>
        <el-table-column label="参会" width="240">
          <template #default="{ row }">
            <el-input
              v-model="invite[row.id]"
              size="small"
              placeholder="账号/手机号/邮箱"
              style="width: 160px"
            />
            <el-button size="small" @click="inviteWho(row)">邀请</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-divider />
    <el-card>
      <template #header>任务</template>
      <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
        <el-input
          v-model="taskTitle"
          placeholder="任务标题"
          style="width: 260px; margin-right: 8px"
        />
        <el-button @click="createTask">新增任务</el-button>
        <el-select
          v-model="taskScene"
          placeholder="场景"
          clearable
          size="small"
          style="width: 120px"
        >
          <el-option label="事件" value="事件" />
          <el-option label="演练" value="演练" />
        </el-select>
        <el-button size="small" @click="exportTasksCsv">导出任务CSV</el-button>
      </div>
      <el-table :data="tasks" size="small" border>
        <el-table-column prop="id" label="任务ID" width="140" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="scene" label="场景" width="100" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column label="操作" width="200"
          ><template #default="{ row }">
            <el-button size="small" @click="setStatus(row, '进行中')">进行中</el-button>
            <el-button size="small" type="success" @click="setStatus(row, '已完成')"
              >完成</el-button
            >
          </template></el-table-column
        >
      </el-table>
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../services/api';
const form = reactive<any>({ scene: '事件', topic: '校园食安应急会议' });
const meetings = ref<any[]>([]);
const tasks = ref<any[]>([]);
const taskTitle = ref('疏散人员');
const invite = ref<Record<string, string>>({});
const taskScene = ref<any>('');
async function load() {
  meetings.value = await api.emergMeetings();
  tasks.value = await api.emergTasks();
}
async function start() {
  await api.emergMeetingCreate({ scene: form.scene, title: form.topic, micOn: true, camOn: false });
  await load();
}
async function createTask() {
  await api.emergTaskCreate({ scene: '事件', title: taskTitle.value, assignees: [] });
  await load();
}
async function setStatus(row: any, s: '进行中' | '已完成') {
  await api.emergTaskSetStatus(row.id, s);
  await load();
}
async function setMeeting(row: any, patch: any) {
  await api.emergMeetingState(row.id, patch);
  await load();
}
async function inviteWho(row: any) {
  const who = invite.value[row.id];
  if (!who) return;
  await api.emergMeetingInvite(row.id, who);
  invite.value[row.id] = '';
  await load();
}
async function exportTasksCsv() {
  const csv = await api.emergTasksExportCsv(taskScene.value || undefined);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '应急任务.csv';
  a.click();
  URL.revokeObjectURL(url);
}
load();
</script>
