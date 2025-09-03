<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>卫生检查台账</span>
        <div>
          <el-button type="primary" @click="openCreate">新建检查</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="结果">
        <el-select v-model="filters.result" clearable placeholder="全部" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="result" label="结果" width="120">
        <template #default="{ row }"
          ><el-tag :type="row.result === '合格' ? 'success' : 'danger'" effect="plain">{{
            row.result
          }}</el-tag></template
        >
      </el-table-column>
      <el-table-column prop="by" label="检查人" width="140" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="时间" width="180"
        ><template #default="{ row }">{{ formatTime(row.date) }}</template></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建卫生检查" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="结果">
        <el-select v-model="form.result" placeholder="请选择">
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item label="检查人">
        <el-input v-model="form.by" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolIdNum } from '../utils/school';
import { ElMessage } from 'element-plus';
const rows = ref<any[]>([]);
const filters = reactive<{ result: '' | '合格' | '不合格' | null; range: [Date, Date] | null }>({
  result: '' as any,
  range: null,
});
async function load() {
  const params: any = { schoolId: getCurrentSchoolIdNum() };
  if (filters.result) params.result = filters.result;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  try {
    const res = await api.hygieneList(params);
    rows.value = res.items;
  } catch {
    ElMessage.error('加载失败');
  }
}
function applyFilters() {
  load();
}

const createVisible = ref(false);
const form = reactive({ result: '合格', by: '', remark: '' });
const openCreate = () => {
  form.result = '合格';
  form.by = '';
  form.remark = '';
  createVisible.value = true;
};
async function save() {
  if (!form.result || !form.by) {
    ElMessage.warning('请填写结果与检查人');
    return;
  }
  try {
    await api.hygieneCreate({
      schoolId: getCurrentSchoolIdNum(),
      result: form.result as any,
      by: form.by,
      remark: form.remark || undefined,
    });
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  }
}
const onExportCsv = () =>
  exportCsv('卫生检查', rows.value, {
    id: 'ID',
    result: '结果',
    by: '检查人',
    remark: '备注',
    date: '时间',
  });
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
let off: any = null;
onMounted(() => {
  load();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
</script>
