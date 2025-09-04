<template>
  <el-card>
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span>培训与考试</span>
          <div>
            <el-button type="primary" @click="openCreateCourse">新增课程</el-button>
            <el-button type="primary" @click="openCreateExam">新增考试</el-button>
            <el-button @click="exportCourses">导出课程</el-button>
            <el-button @click="exportExams">导出考试</el-button>
            <el-button @click="onExportCsv">导出成绩</el-button>
          </div>
        </div>
      </template>
      <el-tabs v-model="tab">
        <el-tab-pane label="培训课程" name="courses">
          <el-table :data="courses" size="small" border>
            <el-table-column prop="id" label="课程ID" width="140" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="status" label="状态" width="120" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="考试" name="exams">
          <el-table :data="exams" size="small" border>
            <el-table-column prop="id" label="考试ID" width="140" />
            <el-table-column prop="title" label="标题" />
            <el-table-column label="关联课程"
              ><template #default="{ row }">{{
                courseTitle(row.courseId)
              }}</template></el-table-column
            >
            <el-table-column prop="status" label="状态" width="120" />
            <el-table-column label="操作" width="420">
              <template #default="{ row }">
                <el-button size="small" @click="openQuestions(row)">管理题库</el-button>
                <el-button size="small" @click="setExamStatus(row, '未开始')">重置</el-button>
                <el-button size="small" type="success" @click="setExamStatus(row, '进行中')"
                  >开始</el-button
                >
                <el-button size="small" type="warning" @click="setExamStatus(row, '已结束')"
                  >结束</el-button
                >
                <el-button size="small" type="primary" @click="openNotify(row)">通知</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="成绩结果" name="results">
          <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
            <el-select
              v-model="filters.examId"
              placeholder="请选择考试"
              clearable
              style="min-width: 220px"
            >
              <el-option v-for="e in exams" :key="e.id" :label="e.title" :value="e.id" />
            </el-select>
            <el-input
              v-model="filters.user"
              placeholder="学员姓名/关键词"
              clearable
              style="width: 220px"
            />
            <el-button @click="loadResults">查询</el-button>
          </div>
          <el-table :data="results" size="small" border>
            <el-table-column prop="id" label="记录ID" width="140" />
            <el-table-column prop="user" label="人员" />
            <el-table-column prop="score" label="得分" width="120" />
            <el-table-column label="结果" width="120"
              ><template #default="{ row }"
                ><el-tag :type="row.passed ? 'success' : 'danger'" effect="plain">{{
                  row.passed ? '合格' : '不合格'
                }}</el-tag></template
              ></el-table-column
            >
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-dialog v-model="courseDlg" title="新增课程" width="520px">
      <el-form :model="courseForm" label-width="96px">
        <el-form-item label="标题" required><el-input v-model="courseForm.title" /></el-form-item>
        <el-form-item label="简介"
          ><el-input v-model="courseForm.desc" type="textarea"
        /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDlg = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="examDlg" title="新增考试" width="640px">
      <el-form :model="examForm" label-width="140px">
        <el-form-item label="标题" required><el-input v-model="examForm.title" /></el-form-item>
        <el-form-item label="关联课程"
          ><el-select v-model="examForm.courseId" clearable style="width: 280px"
            ><el-option
              v-for="c in courses"
              :key="c.id"
              :label="c.title"
              :value="c.id" /></el-select
        ></el-form-item>
        <el-form-item label="乱序"><el-switch v-model="examForm.shuffle" /></el-form-item>
        <el-form-item label="显示分数"><el-switch v-model="examForm.showScore" /></el-form-item>
        <el-form-item label="显示答案"><el-switch v-model="examForm.showAnswers" /></el-form-item>
        <el-form-item label="显示解析"><el-switch v-model="examForm.showAnalysis" /></el-form-item>
        <el-form-item label="及格分"
          ><el-input-number v-model="examForm.passScore" :min="0" :max="100"
        /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examDlg = false">取消</el-button>
        <el-button type="primary" @click="saveExam">保存</el-button>
      </template>
    </el-dialog>
  </el-card>

  <!-- 题库管理 -->
  <el-dialog v-model="qDlg" title="题库管理" width="840px">
    <div
      style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center"
    >
      <div>
        当前考试：<strong>{{ currentExam?.title || '-' }}</strong>
      </div>
      <div>
        <el-button size="small" @click="openQuestionCreate">新增题目</el-button>
        <el-button size="small" @click="openImport">批量导入</el-button>
      </div>
    </div>
    <el-table :data="questions" size="small" border>
      <el-table-column prop="id" label="题ID" width="120" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="stem" label="题干" />
      <el-table-column prop="score" label="分值" width="80" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openQuestionEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteQuestion(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <!-- 单题新增/编辑 -->
  <el-dialog v-model="qFormDlg" :title="qForm.id ? '编辑题目' : '新增题目'" width="640px">
    <el-form :model="qForm" label-width="108px">
      <el-form-item label="类型"
        ><el-select v-model="qForm.type" style="width: 200px">
          <el-option label="单选" value="single" />
          <el-option label="多选" value="multiple" />
          <el-option label="判断" value="boolean" /> </el-select
      ></el-form-item>
      <el-form-item label="题干"><el-input v-model="qForm.stem" type="textarea" /></el-form-item>
      <el-form-item v-if="qForm.type !== 'boolean'" label="选项(A/B/C...)">
        <el-input v-model="qOptionsText" type="textarea" placeholder="每行一个，如：A:是" />
      </el-form-item>
      <el-form-item label="答案"
        ><el-input v-model="qAnswerText" placeholder="单选如A；多选如A,C；判断填true/false"
      /></el-form-item>
      <el-form-item label="解析"
        ><el-input v-model="qForm.analysis" type="textarea"
      /></el-form-item>
      <el-form-item label="分值"
        ><el-input-number v-model="qForm.score" :min="1" :max="100"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="qFormDlg = false">取消</el-button>
      <el-button type="primary" @click="saveQuestion">保存</el-button>
    </template>
  </el-dialog>

  <!-- 批量导入 -->
  <el-dialog v-model="importDlg" title="批量导入题目(JSON)" width="720px">
    <p>
      粘贴 JSON
      数组，例如：[{"type":"single","stem":"...","options":[{"key":"A","text":"是"}],"answer":["A"],"score":5}]
    </p>
    <el-input v-model="importText" type="textarea" :rows="10" />
    <template #footer>
      <el-button @click="importDlg = false">取消</el-button>
      <el-button type="primary" @click="doImport">导入</el-button>
    </template>
  </el-dialog>

  <!-- 通知发送 -->
  <el-dialog v-model="notifyDlg" title="发送考试通知" width="520px">
    <el-form :model="notifyForm" label-width="120px">
      <el-form-item label="考试"><el-input :value="currentExam?.title" disabled /></el-form-item>
      <el-form-item label="渠道">
        <el-select v-model="notifyForm.channel" style="width: 200px">
          <el-option label="短信" value="sms" />
          <el-option label="App" value="app" />
          <el-option label="邮箱" value="email" />
        </el-select>
      </el-form-item>
      <el-form-item label="接收人(账号/手机号/邮箱)">
        <el-input v-model="notifyForm.to" placeholder="多个用逗号分隔（可先填演示值）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="notifyDlg = false">取消</el-button>
      <el-button type="primary" @click="sendNotify">发送</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { exportCsv } from '../utils/export';
import { API_BASE } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const initialTab = ((): 'courses' | 'exams' | 'results' => {
  const t = String(route.query.tab || '').toLowerCase();
  if (t === 'exams') return 'exams';
  if (t === 'results') return 'results';
  return 'courses';
})();
const tab = ref<'courses' | 'exams' | 'results'>(initialTab);
const courses = ref<any[]>([]);
const exams = ref<any[]>([]);
const results = ref<any[]>([]);
const filters = ref<{ examId?: string; user?: string }>({ examId: undefined, user: '' });
async function load() {
  const sid = getCurrentSchoolId();
  courses.value = await (
    await fetch(`${API_BASE}/school/training/courses?schoolId=${encodeURIComponent(sid)}`)
  ).json();
  exams.value = await (
    await fetch(`${API_BASE}/school/training/exams?schoolId=${encodeURIComponent(sid)}`)
  ).json();
  await loadResults();
}
function courseTitle(id?: string) {
  return courses.value.find((c: any) => c.id === id)?.title || '-';
}
const courseDlg = ref(false);
const courseForm = ref<{ title: string; desc?: string }>({ title: '', desc: '' });
function openCreateCourse() {
  courseForm.value = { title: '', desc: '' };
  courseDlg.value = true;
}
async function saveCourse() {
  if (!courseForm.value.title) return;
  const sid = getCurrentSchoolId();
  await fetch(`${API_BASE}/school/training/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...courseForm.value, schoolId: sid }),
  });
  courseDlg.value = false;
  load();
}

const examDlg = ref(false);
const examForm = ref<{
  title: string;
  courseId?: string;
  shuffle: boolean;
  showScore: boolean;
  showAnswers: boolean;
  showAnalysis: boolean;
  passScore: number;
}>({
  title: '',
  courseId: undefined,
  shuffle: true,
  showScore: true,
  showAnswers: false,
  showAnalysis: true,
  passScore: 60,
});
function openCreateExam() {
  examForm.value = {
    title: '',
    courseId: courses.value[0]?.id,
    shuffle: true,
    showScore: true,
    showAnswers: false,
    showAnalysis: true,
    passScore: 60,
  };
  examDlg.value = true;
}
async function saveExam() {
  if (!examForm.value.title) return;
  const sid = getCurrentSchoolId();
  await fetch(`${API_BASE}/school/training/exams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...examForm.value, schoolId: sid }),
  });
  examDlg.value = false;
  load();
}
async function exportCourses() {
  const sid = getCurrentSchoolId();
  const res = await fetch(
    `${API_BASE}/school/training/courses/export.csv?schoolId=${encodeURIComponent(sid)}`,
  );
  const { csv } = await res.json();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '培训课程.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function exportExams() {
  const sid = getCurrentSchoolId();
  const res = await fetch(
    `${API_BASE}/school/training/exams/export.csv?schoolId=${encodeURIComponent(sid)}`,
  );
  const { csv } = await res.json();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '考试.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function loadResults() {
  const s = new URLSearchParams();
  s.set('schoolId', getCurrentSchoolId());
  if (filters.value.examId) s.set('examId', filters.value.examId);
  if (filters.value.user) s.set('user', filters.value.user);
  results.value = await (await fetch(`${API_BASE}/school/training/results?${s.toString()}`)).json();
}
async function onExportCsv() {
  const s = new URLSearchParams();
  s.set('schoolId', getCurrentSchoolId());
  if (filters.value.examId) s.set('examId', filters.value.examId);
  if (filters.value.user) s.set('user', filters.value.user);
  const res = await fetch(`${API_BASE}/school/training/results/export.csv?${s.toString()}`);
  const { csv } = await res.json();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '培训考试成绩.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Questions management
const qDlg = ref(false);
const questions = ref<any[]>([]);
const currentExam = ref<any | null>(null);
async function openQuestions(exam: any) {
  currentExam.value = exam;
  await loadQuestions(exam.id);
  qDlg.value = true;
}
async function loadQuestions(examId: string) {
  questions.value = await (
    await fetch(`${API_BASE}/school/training/questions?examId=${encodeURIComponent(examId)}`)
  ).json();
}
async function setExamStatus(row: any, status: '未开始' | '进行中' | '已结束') {
  await fetch(`${API_BASE}/school/training/exams/status?id=${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  await load();
}

const qFormDlg = ref(false);
const qForm = ref<any>({
  id: '',
  examId: '',
  type: 'single',
  stem: '',
  options: [],
  analysis: '',
  score: 5,
});
const qOptionsText = ref('');
const qAnswerText = ref('');
function openQuestionCreate() {
  qForm.value = {
    id: '',
    examId: currentExam.value?.id,
    type: 'single',
    stem: '',
    options: [],
    analysis: '',
    score: 5,
  };
  qOptionsText.value = '';
  qAnswerText.value = '';
  qFormDlg.value = true;
}
function openQuestionEdit(row: any) {
  qForm.value = { ...row };
  qOptionsText.value = (row.options || []).map((o: any) => `${o.key}:${o.text}`).join('\n');
  qAnswerText.value = (row.answer || []).join(',');
  qFormDlg.value = true;
}
function parseOptions(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.split(':');
      return { key: m[0]?.trim(), text: m.slice(1).join(':').trim() };
    })
    .filter((o) => o.key && o.text);
}
async function saveQuestion() {
  const payload: any = {
    examId: currentExam.value?.id,
    type: qForm.value.type,
    stem: qForm.value.stem,
    options: qForm.value.type === 'boolean' ? undefined : parseOptions(qOptionsText.value),
    answer: (qAnswerText.value || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    analysis: qForm.value.analysis,
    score: qForm.value.score,
  };
  if (qForm.value.id) {
    await fetch(`${API_BASE}/school/training/questions?id=${encodeURIComponent(qForm.value.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch(`${API_BASE}/school/training/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  qFormDlg.value = false;
  await loadQuestions(currentExam.value!.id);
}
async function deleteQuestion(row: any) {
  await fetch(`${API_BASE}/school/training/questions/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: row.id }),
  });
  await loadQuestions(currentExam.value!.id);
}

// Import
const importDlg = ref(false);
const importText = ref('');
function openImport() {
  importText.value = '';
  importDlg.value = true;
}
async function doImport() {
  const items = JSON.parse(importText.value || '[]');
  await fetch(`${API_BASE}/school/training/questions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examId: currentExam.value?.id, items }),
  });
  importDlg.value = false;
  await loadQuestions(currentExam.value!.id);
}

// Notify
const notifyDlg = ref(false);
const notifyForm = ref<{ channel: 'sms' | 'app' | 'email'; to: string }>({
  channel: 'app',
  to: '',
});
function openNotify(row: any) {
  currentExam.value = row;
  notifyForm.value = { channel: 'app', to: '' };
  notifyDlg.value = true;
}
async function sendNotify() {
  await fetch(`${API_BASE}/school/training/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examId: currentExam.value?.id, ...notifyForm.value }),
  });
  notifyDlg.value = false;
}
function onSchoolChanged() {
  load();
}
onMounted(() => {
  load();
  window.addEventListener('school-changed', onSchoolChanged as any);
});
onUnmounted(() => {
  window.removeEventListener('school-changed', onSchoolChanged as any);
});

// If navigated directly to /training/exams, reflect tab
watch(
  () => route.query.tab,
  (t) => {
    const v = String(t || '').toLowerCase();
    if (v === 'exams') tab.value = 'exams';
    else if (v === 'results') tab.value = 'results';
    else tab.value = 'courses';
  },
);

// Optional: update URL query when switching tabs (keeps deep-linking)
watch(tab, (v) => {
  const q = { ...route.query, tab: v } as any;
  router.replace({ path: route.path, query: q });
});
</script>
