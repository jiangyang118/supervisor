<template>
  <el-card>
    <template #header>公众投诉/建议/表扬/评论处理</template>
    <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
      <el-select v-model="filters.type" placeholder="类型" clearable style="width: 140px">
        <el-option label="投诉" value="投诉" />
        <el-option label="建议" value="建议" />
        <el-option label="表扬" value="表扬" />
        <el-option label="评论" value="评论" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px">
        <el-option label="待处理" value="待处理" />
        <el-option label="已回复" value="已回复" />
      </el-select>
      <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      <el-button @click="load">查询</el-button>
      <el-button @click="exportCsv">导出 CSV</el-button>
      <el-divider direction="vertical" />
      <el-button :disabled="selected.length === 0" @click="batchReplyOpen">批量回复</el-button>
      <el-button type="primary" @click="openCreate">新增记录</el-button>
    </div>
    <el-table :data="rows" size="small" border @selection-change="onSelChange">
      <el-table-column type="selection" width="46" />
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="user" label="用户" width="120" />
      <el-table-column label="状态" width="160">
        <template #default="{ row }">
          <el-tag
            :type="row.status === '已回复' ? 'success' : 'warning'"
            effect="plain"
            style="margin-right: 6px"
            >{{ row.status }}</el-tag
          >
          <el-tag :type="row.read ? 'info' : 'danger'" effect="plain">{{
            row.read ? '已读' : '未读'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="处理" width="300">
        <template #default="{ row }">
          <el-button size="small" @click="openReply(row)">一键回复</el-button>
          <el-button size="small" @click="markRead(row, !row.read)">{{
            row.read ? '标记未读' : '标记已读'
          }}</el-button>
          <span v-if="row.processingMs" style="margin-left: 8px; color: #999"
            >耗时：{{ Math.round(row.processingMs / 1000) }}s</span
          >
        </template>
      </el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="replyDlg" title="一键回复" width="520px">
    <el-input v-model="replyContent" type="textarea" :rows="4" />
    <template #footer>
      <el-button @click="replyDlg = false">取消</el-button>
      <el-button type="primary" @click="doReply">发送</el-button>
    </template>
  </el-dialog>
  <el-dialog v-model="createDlg" title="新增反馈" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="类型">
        <el-select v-model="form.type" placeholder="请选择">
          <el-option label="投诉" value="投诉" />
          <el-option label="建议" value="建议" />
          <el-option label="表扬" value="表扬" />
          <el-option label="评论" value="评论" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" /></el-form-item>
      <el-form-item label="用户"><el-input v-model="form.user" /></el-form-item>
      <el-form-item label="联系方式"><el-input v-model="form.contact" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createDlg = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const filters = ref<{ type?: any; status?: any; range: [Date, Date] | null }>({
  type: '',
  status: '',
  range: null,
});
const selected = ref<any[]>([]);
function onSelChange(sel: any[]) {
  selected.value = sel;
}
async function load() {
  const p: any = {};
  if (filters.value.type) p.type = filters.value.type;
  if (filters.value.status) p.status = filters.value.status;
  if (filters.value.range && filters.value.range.length === 2) {
    p.start = filters.value.range[0].toISOString();
    p.end = filters.value.range[1].toISOString();
  }
  const res = await api.publicFeedbackList(p);
  rows.value = res.items;
}
const replyDlg = ref(false);
const replyRow = ref<any | null>(null);
const replyContent = ref('已收到您的反馈，我们会尽快处理。');
function openReply(r: any) {
  replyRow.value = r;
  replyContent.value = '已收到您的反馈，我们会尽快处理。';
  replyDlg.value = true;
}
async function doReply() {
  if (replyRow.value) {
    await api.publicFeedbackReply(replyRow.value.id, replyContent.value, '管理员');
  } else if (selected.value.length) {
    await api.publicFeedbackBatchReply(
      selected.value.map((r: any) => r.id),
      replyContent.value,
      '管理员',
    );
    selected.value = [];
  } else {
    replyDlg.value = false;
    return;
  }
  replyDlg.value = false;
  await load();
}
const createDlg = ref(false);
const form = ref<any>({ type: '建议', content: '', user: '', contact: '' });
function openCreate() {
  form.value = { type: '建议', content: '', user: '', contact: '' };
  createDlg.value = true;
}
async function save() {
  await api.publicFeedbackCreate(form.value);
  createDlg.value = false;
  await load();
}
load();

async function exportCsv() {
  const p: any = {};
  if (filters.value.type) p.type = filters.value.type;
  if (filters.value.status) p.status = filters.value.status;
  if (filters.value.range && filters.value.range.length === 2) {
    p.start = filters.value.range[0].toISOString();
    p.end = filters.value.range[1].toISOString();
  }
  const csv = await api.publicFeedbackExportCsv(p);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '公众反馈.csv';
  a.click();
  URL.revokeObjectURL(url);
}
function batchReplyOpen() {
  replyRow.value = null;
  replyContent.value = '统一回复：感谢反馈，我们会尽快跟进。';
  replyDlg.value = true;
}
async function markRead(row: any, read: boolean) {
  await api.publicFeedbackMarkRead(row.id, read);
  await load();
}
</script>
