<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>固定资产维护台账</span>
        <div>
          <el-button type="primary" @click="openCreate">新建维护</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="资产">
        <el-input v-model="filters.asset" />
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
      <el-table-column prop="asset" label="资产" />
      <el-table-column prop="action" label="维护内容" />
      <el-table-column prop="by" label="负责人" />
      <el-table-column label="时间" width="180"
        ><template #default="{ row }">{{ formatTime(row.date) }}</template></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建资产维护" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="资产">
        <el-input v-model="form.asset" />
      </el-form-item>
      <el-form-item label="维护内容">
        <el-input v-model="form.action" />
      </el-form-item>
      <el-form-item label="负责人">
        <el-input v-model="form.by" />
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="form.date" type="datetime" />
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
import { ElMessage } from 'element-plus';
const rows = ref<any[]>([]);
const filters = reactive<{ asset: string; range: [Date, Date] | null }>({ asset: '', range: null });
async function load() {
  const params: any = {};
  if (filters.asset) params.asset = filters.asset;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  try {
    const res = await api.assetsList(params);
    rows.value = res.items;
  } catch {
    ElMessage.error('加载失败');
  }
}
function applyFilters() {
  load();
}

const createVisible = ref(false);
const form = reactive<{ asset: string; action: string; by: string; date?: Date | null }>({
  asset: '',
  action: '',
  by: '',
} as any);
const openCreate = () => {
  form.asset = '';
  form.action = '';
  form.by = '';
  form.date = undefined;
  createVisible.value = true;
};
async function save() {
  if (!form.asset || !form.action || !form.by) {
    ElMessage.warning('请填写资产、维护内容、负责人');
    return;
  }
  try {
    await api.assetsCreate({
      asset: form.asset,
      action: form.action,
      by: form.by,
      date: (form.date as any)?.toISOString?.(),
    });
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  }
}
const onExportCsv = () =>
  exportCsv('固定资产维护', rows.value, {
    id: 'ID',
    asset: '资产',
    action: '维护内容',
    by: '负责人',
    date: '时间',
  });
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
onMounted(() => load());
</script>
