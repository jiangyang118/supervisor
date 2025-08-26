<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>培训考试监管</span>
        <div>
          <el-button @click="onExportCsv">导出台账</el-button>
        </div>
      </div>
    </template>
    <el-tabs v-model="tab">
      <el-tab-pane label="培训课程" name="courses">
        <el-table :data="courses" size="small" border>
          <el-table-column prop="id" label="课程ID" width="140" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="school" label="学校" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="考试" name="exams">
        <el-table :data="exams" size="small" border>
          <el-table-column prop="id" label="考试ID" width="140" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="strategy" label="策略" />
          <el-table-column prop="status" label="状态" width="120" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="成绩结果" name="results">
        <el-table :data="results" size="small" border>
          <el-table-column prop="id" label="记录ID" width="140" />
          <el-table-column prop="school" label="学校" />
          <el-table-column prop="user" label="人员" />
          <el-table-column prop="score" label="得分" width="120" />
          <el-table-column prop="passed" label="结果" width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const tab = ref('courses');
const courses = ref([{ id: 'CRS-001', title: '后厨卫生规范', school: '示例一中' }]);
const exams = ref([
  { id: 'EX-001', title: '卫生规范考试', strategy: '乱序+自动判卷', status: '进行中' },
]);
const results = ref([
  { id: 'RES-001', school: '示例二小', user: '张三', score: 92, passed: '合格' },
]);
const onExportCsv = () =>
  exportCsv('培训考试台账', results.value as any, {
    id: '记录ID',
    school: '学校',
    user: '人员',
    score: '得分',
    passed: '结果',
  });
</script>
