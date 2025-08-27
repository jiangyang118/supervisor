<template>
  <el-card>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>培训与考试</span>
        <div>
          <el-button type="primary" @click="openCreateCourse">新增课程</el-button>
          <el-button type="primary" @click="openCreateExam">新增考试</el-button>
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
          <el-table-column label="关联课程"><template #default="{ row }">{{ courseTitle(row.courseId) }}</template></el-table-column>
          <el-table-column prop="status" label="状态" width="120" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="成绩结果" name="results">
        <el-table :data="results" size="small" border>
          <el-table-column prop="id" label="记录ID" width="140" />
          <el-table-column prop="user" label="人员" />
          <el-table-column prop="score" label="得分" width="120" />
          <el-table-column label="结果" width="120"><template #default="{ row }"><el-tag :type="row.passed ? 'success' : 'danger'" effect="plain">{{ row.passed ? '合格' : '不合格' }}</el-tag></template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
    <el-dialog v-model="courseDlg" title="新增课程" width="520px">
      <el-form :model="courseForm" label-width="96px">
        <el-form-item label="标题" required><el-input v-model="courseForm.title" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="courseForm.desc" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDlg=false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="examDlg" title="新增考试" width="640px">
      <el-form :model="examForm" label-width="140px">
        <el-form-item label="标题" required><el-input v-model="examForm.title" /></el-form-item>
        <el-form-item label="关联课程"><el-select v-model="examForm.courseId" clearable style="width: 280px"><el-option v-for="c in courses" :key="c.id" :label="c.title" :value="c.id" /></el-select></el-form-item>
        <el-form-item label="乱序"><el-switch v-model="examForm.shuffle" /></el-form-item>
        <el-form-item label="显示分数"><el-switch v-model="examForm.showScore" /></el-form-item>
        <el-form-item label="显示答案"><el-switch v-model="examForm.showAnswers" /></el-form-item>
        <el-form-item label="显示解析"><el-switch v-model="examForm.showAnalysis" /></el-form-item>
        <el-form-item label="及格分"><el-input-number v-model="examForm.passScore" :min="0" :max="100" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examDlg=false">取消</el-button>
        <el-button type="primary" @click="saveExam">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { API_BASE } from '../services/api';
const tab = ref('courses');
const courses = ref<any[]>([]);
const exams = ref<any[]>([]);
const results = ref<any[]>([]);
async function load(){
  courses.value = await (await fetch(`${API_BASE}/school/training/courses`)).json();
  exams.value = await (await fetch(`${API_BASE}/school/training/exams`)).json();
  results.value = await (await fetch(`${API_BASE}/school/training/results`)).json();
}
function courseTitle(id?: string){ return courses.value.find((c:any)=>c.id===id)?.title || '-'; }
const courseDlg = ref(false);
const courseForm = ref<{ title: string; desc?: string }>({ title: '', desc: '' });
function openCreateCourse(){ courseForm.value={ title:'', desc:'' }; courseDlg.value = true; }
async function saveCourse(){ if(!courseForm.value.title) return; await fetch(`${API_BASE}/school/training/courses`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(courseForm.value) }); courseDlg.value=false; load(); }

const examDlg = ref(false);
const examForm = ref<{ title: string; courseId?: string; shuffle: boolean; showScore: boolean; showAnswers: boolean; showAnalysis: boolean; passScore: number }>({ title:'', courseId: undefined, shuffle:true, showScore:true, showAnswers:false, showAnalysis:true, passScore: 60 });
function openCreateExam(){ examForm.value={ title:'', courseId:courses.value[0]?.id, shuffle:true, showScore:true, showAnswers:false, showAnalysis:true, passScore:60 }; examDlg.value=true; }
async function saveExam(){ if(!examForm.value.title) return; await fetch(`${API_BASE}/school/training/exams`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(examForm.value) }); examDlg.value=false; load(); }
const onExportCsv = () =>
  exportCsv('培训考试成绩', results.value as any, {
    id: '记录ID',
    user: '人员',
    score: '得分',
    passed: '是否合格',
  });
onMounted(()=>load());
</script>
