<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>培训考试监管</span>
      </div>
    </template>
    <el-tabs v-model="tab">
      <el-tab-pane label="培训课程" name="courses">
        <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
          <el-select
            v-model="filters.schoolId"
            placeholder="选择学校(可选)"
            clearable
            style="min-width: 240px"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button @click="loadCourses">查询</el-button>
          <el-button @click="exportCoursesCsv">导出 CSV</el-button>
        </div>
        <el-table :data="courses" size="small" border>
          <el-table-column prop="id" label="课程ID" width="160" />
          <el-table-column prop="title" label="课程标题" />
          <el-table-column prop="school" label="学校" width="180" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="createdAt" label="创建时间" width="200" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="考试" name="exams">
        <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
          <el-select
            v-model="filters.schoolId"
            placeholder="选择学校(可选)"
            clearable
            style="min-width: 240px"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button @click="loadExams">查询</el-button>
          <el-button @click="exportExamsCsv">导出 CSV</el-button>
        </div>
        <el-table :data="exams" size="small" border>
          <el-table-column prop="id" label="考试ID" width="160" />
          <el-table-column prop="title" label="标题" />
          <el-table-column label="关联课程" min-width="160">
            <template #default="{ row }">{{ row.courseTitle || '-' }}</template>
          </el-table-column>
          <el-table-column prop="school" label="学校" width="180" />
          <el-table-column prop="passScore" label="及格分" width="100" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="createdAt" label="创建时间" width="200" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="成绩结果" name="results">
        <div
          style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap"
        >
          <el-select
            v-model="filters.schoolId"
            placeholder="选择学校(可选)"
            clearable
            style="min-width: 240px"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-input
            v-model="filters.examId"
            placeholder="考试ID(可选)"
            clearable
            style="width: 220px"
          />
          <el-input
            v-model="filters.user"
            placeholder="人员(可选)"
            clearable
            style="width: 220px"
          />
          <el-button @click="loadResults">查询</el-button>
          <el-button @click="exportResultsCsv">导出 CSV</el-button>
        </div>
        <el-table :data="results" size="small" border>
          <el-table-column prop="id" label="记录ID" width="160" />
          <el-table-column prop="school" label="学校" width="180" />
          <el-table-column prop="examId" label="考试ID" width="160" />
          <el-table-column prop="user" label="人员" width="160" />
          <el-table-column prop="score" label="得分" width="100" />
          <el-table-column prop="passed" label="结果" width="100" />
          <el-table-column prop="submittedAt" label="提交时间" width="200" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';

const tab = ref<'courses' | 'exams' | 'results'>('courses');
const schools = ref<Array<{ id: string; name: string }>>([]);
const filters = ref<{ schoolId?: string; examId?: string; user?: string }>({
  schoolId: undefined,
  examId: '',
  user: '',
});

const courses = ref<any[]>([]);
const exams = ref<any[]>([]);
const results = ref<any[]>([]);

async function loadSchools() {
  const stats = await api.schools();
  schools.value = (stats || []).map((s: any) => ({ id: s.id, name: s.name }));
}
async function loadCourses() {
  if (!filters.value.schoolId) { courses.value = []; return; }
  const list = await api.schoolTrainingCourses(filters.value.schoolId);
  courses.value = (list || []).map((c: any) => ({ ...c, school: schools.value.find(s => s.id === c.schoolId)?.name || '' }));
}
async function loadExams() {
  if (!filters.value.schoolId) { exams.value = []; return; }
  const [list, courseList] = await Promise.all([
    api.schoolTrainingExams(filters.value.schoolId),
    api.schoolTrainingCourses(filters.value.schoolId),
  ]);
  const cmap = new Map((courseList || []).map((c: any) => [c.id, c.title] as const));
  exams.value = (list || []).map((e: any) => ({ ...e, school: schools.value.find(s => s.id === (e.schoolId || filters.value.schoolId))?.name || '', courseTitle: (e.courseId && cmap.get(e.courseId)) || '' }));
}
async function loadResults() {
  if (!filters.value.schoolId) { results.value = []; return; }
  const res = await api.schoolTrainingResults({
    schoolId: filters.value.schoolId,
    examId: filters.value.examId || undefined,
    user: filters.value.user || undefined,
  });
  results.value = Array.isArray(res?.items) ? res.items : (res as any);
}
async function exportCoursesCsv() {
  if (!filters.value.schoolId) return;
  const csv = await api.schoolTrainingCoursesExportCsv(filters.value.schoolId);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '培训台账.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function exportExamsCsv() {
  if (!filters.value.schoolId) return;
  const csv = await api.schoolTrainingExamsExportCsv(filters.value.schoolId);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '考试台账.csv';
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  await loadSchools();
  await loadCourses();
  await loadExams();
});
// optionally lazy load results when tab selected, but prefetch here for simplicity
onMounted(async () => {
  await loadResults();
});

async function exportResultsCsv() {
  if (!filters.value.schoolId) return;
  const csv = await api.schoolTrainingResultsExportCsv({ schoolId: filters.value.schoolId, examId: filters.value.examId || undefined, user: filters.value.user || undefined });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '培训考试成绩.csv';
  a.click();
  URL.revokeObjectURL(url);
}
</script>
