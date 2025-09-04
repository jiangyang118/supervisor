<template>
  <el-card>
    <template #header>隐患排查管理</template>
    <el-tabs v-model="tab">
      <el-tab-pane label="隐患上报" name="reports">
        <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
          <el-select v-model="reportStatus" placeholder="状态" clearable style="width: 140px">
            <el-option label="待处理" value="待处理" />
            <el-option label="整改中" value="整改中" />
            <el-option label="已整改" value="已整改" />
          </el-select>
          <el-date-picker v-model="range" type="daterange" unlink-panels style="width: 240px" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"  clearable />
          <el-button @click="loadReports">查询</el-button>
          <el-button @click="exportReportsCsv">导出上报CSV</el-button>
          <el-button type="primary" @click="openReportCreate">新增上报</el-button>
        </div>
        <el-table :data="reports.items"   border>
          <el-table-column prop="id" label="上报ID" width="140" />
          <el-table-column prop="at" label="时间" width="180" />
          <el-table-column prop="location" label="地点" />
          <el-table-column prop="object" label="对象" />
          <el-table-column prop="desc" label="描述" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column label="操作" width="360"
            ><template #default="{ row }">
              <el-button   @click="openReportDetail(row)">查看</el-button>
              <el-button v-if="row.status !== '已整改'"   @click="openRectify(row)"
                >标记整改</el-button
              >
              <el-button   @click="openTaskCreate(row)">派发任务</el-button>
            </template></el-table-column
          >
        </el-table>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end">
          <el-pagination
            background
            layout="prev, pager, next, ->, total"
            :total="reports.total"
            :page-size="reports.pageSize"
            :current-page="reports.page"
            @current-change="
              (p: number) => {
                reports.page = p;
                loadReports();
              }
            "
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="排查任务" name="tasks">
        <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
          <el-select v-model="taskStatus" placeholder="状态" clearable style="width: 140px">
            <el-option label="待处理" value="待处理" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
          <el-input v-model="assignee" placeholder="检查人员" style="width: 180px" />
          <el-button @click="loadTasks">查询</el-button>
          <el-button @click="exportTasksCsv">导出任务CSV</el-button>
          <el-button type="primary" @click="openTaskCreate()">新增任务</el-button>
        </div>
        <el-table :data="pagedTasks"   border>
          <el-table-column prop="id" label="任务ID" width="140" />
          <el-table-column prop="assignee" label="检查人员" width="140" />
          <el-table-column prop="location" label="地点" />
          <el-table-column prop="object" label="对象" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column label="操作" width="320"
            ><template #default="{ row }">
              <el-button   @click="openTaskDetail(row)">详情</el-button>
              <el-button   @click="setTask(row, '进行中')">进行中</el-button>
              <el-button   type="success" @click="openTaskSubmit(row)">完成</el-button>
            </template></el-table-column
          >
        </el-table>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end">
          <el-pagination
            background
            layout="prev, pager, next, ->, total"
            :total="tasks.length"
            :page-size="taskPageSize"
            :current-page="taskPage"
            @current-change="
              (p: number) => {
                taskPage = p;
              }
            "
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="风险清单" name="catalog">
        <div style="margin-bottom: 8px; display: flex; gap: 8px">
          <el-button type="primary" @click="openCatalogCreate">新增风险点</el-button>
          <el-button @click="exportCatalogCsv">导出清单CSV</el-button>
        </div>
        <el-table :data="catalog"   border>
          <el-table-column prop="id" label="ID" width="140" />
          <el-table-column prop="category" label="分类" width="140" />
          <el-table-column prop="title" label="风险点" />
          <el-table-column prop="level" label="等级" width="120" />
          <el-table-column label="操作" width="220"
            ><template #default="{ row }">
              <el-button   @click="openCatalogEdit(row)">编辑</el-button>
              <el-button   type="danger" @click="delCatalog(row)">删除</el-button>
            </template></el-table-column
          >
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>

  <!-- 新增上报 -->
  <el-dialog v-model="dlgReport" title="新增隐患上报" width="600px">
    <el-form :model="reportForm" label-width="96px">
      <el-form-item label="地点"><el-input v-model="reportForm.location" /></el-form-item>
      <el-form-item label="对象"><el-input v-model="reportForm.object" /></el-form-item>
      <el-form-item label="描述"
        ><el-input v-model="reportForm.desc" type="textarea"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlgReport = false">取消</el-button>
      <el-button type="primary" @click="saveReport">保存</el-button>
    </template>
  </el-dialog>

  <!-- 标记整改 -->
  <el-dialog v-model="dlgRectify" title="标记整改" width="520px">
    <el-input v-model="rectifyText" type="textarea" :rows="4" placeholder="整改措施" />
    <template #footer>
      <el-button @click="dlgRectify = false">取消</el-button>
      <el-button type="primary" @click="saveRectify">保存</el-button>
    </template>
  </el-dialog>

  <!-- 上报详情 -->
  <el-dialog v-model="dlgReportDetail" title="上报详情" width="600px">
    <el-descriptions :column="2"   border>
      <el-descriptions-item label="ID">{{ reportDetail?.id }}</el-descriptions-item>
      <el-descriptions-item label="时间">{{ reportDetail?.at }}</el-descriptions-item>
      <el-descriptions-item label="地点">{{ reportDetail?.location }}</el-descriptions-item>
      <el-descriptions-item label="对象">{{ reportDetail?.object }}</el-descriptions-item>
      <el-descriptions-item label="描述" :span="2">{{ reportDetail?.desc }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ reportDetail?.status }}</el-descriptions-item>
      <el-descriptions-item label="措施">{{ reportDetail?.measures || '-' }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dlgReportDetail = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 新增任务 -->
  <el-dialog v-model="dlgTask" title="派发排查任务" width="600px">
    <el-form :model="taskForm" label-width="96px">
      <el-form-item label="检查人员"><el-input v-model="taskForm.assignee" /></el-form-item>
      <el-form-item label="地点"><el-input v-model="taskForm.location" /></el-form-item>
      <el-form-item label="对象"><el-input v-model="taskForm.object" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="taskForm.note" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlgTask = false">取消</el-button>
      <el-button type="primary" @click="saveTask">保存</el-button>
    </template>
  </el-dialog>

  <!-- 任务完成提交 -->
  <el-dialog v-model="dlgSubmit" title="提交整改结果" width="520px">
    <el-input v-model="submitText" type="textarea" :rows="4" placeholder="整改结果" />
    <template #footer>
      <el-button @click="dlgSubmit = false">取消</el-button>
      <el-button type="success" @click="saveSubmit">提交</el-button>
    </template>
  </el-dialog>

  <!-- 任务详情 -->
  <el-dialog v-model="dlgTaskDetail" title="任务详情" width="600px">
    <el-descriptions :column="2"   border>
      <el-descriptions-item label="ID">{{ taskDetail?.id }}</el-descriptions-item>
      <el-descriptions-item label="检查人员">{{ taskDetail?.assignee }}</el-descriptions-item>
      <el-descriptions-item label="地点">{{ taskDetail?.location }}</el-descriptions-item>
      <el-descriptions-item label="对象">{{ taskDetail?.object }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ taskDetail?.status }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ taskDetail?.note || '-' }}</el-descriptions-item>
      <el-descriptions-item label="整改结果" :span="2">{{
        taskDetail?.result || '-'
      }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dlgTaskDetail = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 风险清单编辑/新增 -->
  <el-dialog
    v-model="dlgCatalog"
    :title="catalogForm.id ? '编辑风险点' : '新增风险点'"
    width="600px"
  >
    <el-form :model="catalogForm" label-width="96px">
      <el-form-item label="分类"><el-input v-model="catalogForm.category" /></el-form-item>
      <el-form-item label="风险点"><el-input v-model="catalogForm.title" /></el-form-item>
      <el-form-item label="等级"
        ><el-select v-model="catalogForm.level" style="width: 140px"
          ><el-option label="低" value="低" /><el-option label="中" value="中" /><el-option
            label="高"
            value="高" /></el-select
      ></el-form-item>
      <el-form-item label="说明"
        ><el-input v-model="catalogForm.desc" type="textarea"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlgCatalog = false">取消</el-button>
      <el-button type="primary" @click="saveCatalog">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
const tab = ref('reports');
// Reports
const reports = ref<{ items: any[]; total: number; page: number; pageSize: number }>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
});
const reportStatus = ref('');
const range = ref<[Date, Date] | null>(null);
async function loadReports() {
  const p: any = { page: reports.value.page, pageSize: reports.value.pageSize };
  if (reportStatus.value) p.status = reportStatus.value;
  if (range.value && range.value.length === 2) {
    p.start = range.value[0].toISOString();
    p.end = range.value[1].toISOString();
  }
  reports.value = await api.riskReports(p);
}
const dlgReport = ref(false);
const reportForm = ref<any>({ location: '', object: '', desc: '' });
function openReportCreate() {
  reportForm.value = { location: '', object: '', desc: '' };
  dlgReport.value = true;
}
async function saveReport() {
  await api.riskReportCreate(reportForm.value);
  dlgReport.value = false;
  await loadReports();
}
// Rectify
const dlgRectify = ref(false);
const rectifyRow = ref<any>(null);
const rectifyText = ref('');
function openRectify(row: any) {
  rectifyRow.value = row;
  rectifyText.value = '';
  dlgRectify.value = true;
}
async function saveRectify() {
  if (!rectifyRow.value) return;
  await api.riskReportSetStatus(rectifyRow.value.id, {
    status: '已整改',
    measures: rectifyText.value,
    rectifiedBy: '管理员',
  });
  dlgRectify.value = false;
  await loadReports();
}
// Tasks
const tasks = ref<any[]>([]);
const taskStatus = ref('');
const assignee = ref('');
async function loadTasks() {
  tasks.value = await api.riskTasks({
    status: taskStatus.value || undefined,
    assignee: assignee.value || undefined,
  });
}
const dlgTask = ref(false);
const taskForm = ref<any>({ assignee: '', location: '', object: '', note: '' });
const taskFromReport = ref<any>(null);
function openTaskCreate(fromReport?: any) {
  taskFromReport.value = fromReport || null;
  taskForm.value = {
    assignee: '',
    location: fromReport?.location || '',
    object: fromReport?.object || '',
    note: '',
  };
  dlgTask.value = true;
}
async function saveTask() {
  await api.riskTaskCreate(taskForm.value);
  dlgTask.value = false;
  await loadTasks();
}
function setTask(row: any, s: '进行中' | '已完成') {
  if (s === '进行中') api.riskTaskSetStatus(row.id, '进行中').then(loadTasks);
  else openTaskSubmit(row);
}
const dlgSubmit = ref(false);
const submitRow = ref<any>(null);
const submitText = ref('');
function openTaskSubmit(row: any) {
  submitRow.value = row;
  submitText.value = '';
  dlgSubmit.value = true;
}
async function saveSubmit() {
  if (!submitRow.value) return;
  await api.riskTaskSubmit(submitRow.value.id, submitText.value);
  dlgSubmit.value = false;
  await loadTasks();
}

loadReports();
loadTasks();

// Export helpers
async function exportReportsCsv() {
  const p: any = {};
  if (reportStatus.value) p.status = reportStatus.value;
  if (range.value && range.value.length === 2) {
    p.start = range.value[0].toISOString();
    p.end = range.value[1].toISOString();
  }
  const csv = await api.riskReportsExportCsv(p);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '隐患上报.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function exportTasksCsv() {
  const p: any = {};
  if (taskStatus.value) p.status = taskStatus.value;
  if (assignee.value) p.assignee = assignee.value;
  const csv = await api.riskTasksExportCsv(p);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '排查任务.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async function exportCatalogCsv() {
  const csv = await api.riskCatalogExportCsv();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '风险清单.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Catalog CRUD
const catalog = ref<any[]>([]);
const dlgCatalog = ref(false);
const catalogForm = ref<any>({ id: '', category: '', title: '', level: '中', desc: '' });
async function loadCatalog() {
  catalog.value = await api.riskCatalog();
}
function openCatalogCreate() {
  catalogForm.value = { id: '', category: '', title: '', level: '中', desc: '' };
  dlgCatalog.value = true;
}
function openCatalogEdit(row: any) {
  catalogForm.value = { ...row };
  dlgCatalog.value = true;
}
async function saveCatalog() {
  if (!catalogForm.value.title) return;
  if (catalogForm.value.id) await api.riskCatalogUpdate(catalogForm.value.id, catalogForm.value);
  else await api.riskCatalogCreate(catalogForm.value);
  dlgCatalog.value = false;
  await loadCatalog();
}
async function delCatalog(row: any) {
  await api.riskCatalogDelete(row.id);
  await loadCatalog();
}
loadCatalog();
</script>
