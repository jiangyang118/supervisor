<template>
  <el-card class="it-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>监督检查任务</span>
      </div>
    </template>
    <el-form :inline="true" class="it-filters">
      <el-form-item label="检查人"
        ><el-input v-model="assignee" placeholder="我的姓名" style="width: 200px"
      /></el-form-item>
      <el-form-item label="状态"
        ><el-select v-model="status" clearable placeholder="全部" style="width: 160px"
          ><el-option label="待处理" value="待处理" /><el-option
            label="进行中"
            value="进行中" /><el-option label="已完成" value="已完成" /></el-select
      ></el-form-item>
      <el-form-item label="日期"
        ><el-date-picker v-model="range" type="daterange" unlink-panels
      /></el-form-item>
      <el-form-item><el-button @click="load">查询</el-button></el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border height="calc(100vh - 320px)">
      <el-table-column prop="id" label="任务ID" width="140" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="schoolId" label="学校ID" width="140" />
      <el-table-column prop="assignee" label="检查人" width="140" />
      <el-table-column prop="content" label="检查事项" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="createdAt" label="下发时间" width="200" />
      <el-table-column label="操作" width="160"
        ><template #default="{ row }"
          ><el-button
            size="small"
            type="primary"
            :disabled="row.status === '已完成'"
            @click="openSubmit(row)"
            >提交结果</el-button
          ></template
        ></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="submitDlg" title="提交检查结果" width="720px">
    <el-form label-width="120px">
      <el-form-item label="结果"
        ><el-switch v-model="submitForm.passed" active-text="合格" inactive-text="不合格"
      /></el-form-item>
      <el-form-item label="检查明细">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
          <el-select v-model="newItem.item" placeholder="选择项目" style="width: 220px" filterable>
            <el-option v-for="it in cfg.items" :key="it" :label="it" :value="it" />
          </el-select>
          <el-select v-model="newItem.ok" style="width: 120px">
            <el-option label="通过" :value="true" /><el-option label="不通过" :value="false" />
          </el-select>
          <el-select
            v-model="newItem.penaltyType"
            placeholder="处罚(可选)"
            clearable
            style="width: 160px"
          >
            <el-option v-for="p in cfg.penalties" :key="p" :label="p" :value="p" />
          </el-select>
          <el-input v-model="newItem.remark" placeholder="备注(可选)" style="width: 200px" />
          <el-button size="small" @click="addDetail">添加</el-button>
        </div>
        <el-table
          :data="submitForm.items"
          size="small"
          border
          style="max-height: 200px; overflow: auto"
        >
          <el-table-column prop="item" label="项目" />
          <el-table-column prop="ok" label="是否通过" width="120"
            ><template #default="{ row }">{{
              row.ok ? '通过' : '不通过'
            }}</template></el-table-column
          >
          <el-table-column prop="penaltyType" label="处罚" width="140" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </el-form-item>
      <el-form-item label="总结"
        ><el-input v-model="submitForm.summary" type="textarea"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitDlg = false">取消</el-button>
      <el-button type="primary" @click="doSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
const rows = ref<any[]>([]);
const assignee = ref('');
const status = ref<string | ''>('');
const range = ref<[Date, Date] | null>(null);
const cfg = ref<{ items: string[]; penalties: string[]; publications: string[] }>({
  items: [],
  penalties: [],
  publications: [],
});

function withRange(p: any) {
  const q: any = { ...p };
  if (range.value) {
    if (range.value[0]) q.start = new Date(range.value[0]).toISOString();
    if (range.value[1]) q.end = new Date(range.value[1]).toISOString();
  }
  return q;
}
async function load() {
  const params: any = withRange({
    schoolId: getCurrentSchoolId(),
    assignee: assignee.value || undefined,
    status: status.value || undefined,
  });
  const res = await api.inspTasks(params);
  rows.value = res.items || [];
}

const submitDlg = ref(false);
const currentId = ref<string>('');
const submitForm = ref<{
  passed: boolean;
  items: Array<{ item: string; ok: boolean; remark?: string; penaltyType?: string }>;
  summary?: string;
}>({ passed: true, items: [], summary: '' });
const newItem = ref<{ item: string; ok: boolean; penaltyType?: string; remark?: string }>({
  item: '',
  ok: true,
  penaltyType: undefined,
  remark: '',
});
function openSubmit(row: any) {
  currentId.value = row.id;
  submitForm.value = { passed: true, items: [], summary: '' };
  submitDlg.value = true;
}
function addDetail() {
  if (!newItem.value.item) return;
  submitForm.value.items.push({
    item: newItem.value.item,
    ok: newItem.value.ok,
    penaltyType: newItem.value.penaltyType,
    remark: newItem.value.remark,
  });
  newItem.value = { item: '', ok: true, penaltyType: undefined, remark: '' };
}
async function doSubmit() {
  if (!currentId.value) return;
  await api.inspSubmit(currentId.value, submitForm.value);
  submitDlg.value = false;
  await load();
}

onMounted(async () => {
  cfg.value = await api.inspConfig();
  await load();
});
</script>

<style>
.it-card {
  min-height: 480px;
}
.it-filters {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
</style>
