<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>农残台账</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
          <el-button @click="onExportPdf">导出 PDF</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="学校">
        <el-input v-model="filters.school" placeholder="学校名称" />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="filters.result" clearable>
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
      <el-table-column prop="id" label="ID" width="160" />
      <el-table-column prop="school" label="学校" />
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="result" label="结果" width="120" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
type Row = {
  id: string;
  school: string;
  sample: string;
  result: '合格' | '不合格';
  status: string;
  at: string;
};
const rows = ref<Row[]>([
  {
    id: 'PT-001',
    school: '示例一中',
    sample: '黄瓜',
    result: '合格',
    status: '正常',
    at: new Date().toLocaleString(),
  },
  {
    id: 'PT-002',
    school: '示例二小',
    sample: '菠菜',
    result: '不合格',
    status: '异常',
    at: new Date().toLocaleString(),
  },
]);
const filters = reactive<{
  school: string;
  result: '' | '合格' | '不合格' | null;
  range: [Date, Date] | null;
}>({ school: '', result: null, range: null });
const applyFilters = () => {};
const onExportCsv = () =>
  exportCsv('农残台账', rows.value, {
    id: 'ID',
    school: '学校',
    sample: '样品',
    result: '结果',
    status: '状态',
    at: '时间',
  });
const onExportPdf = () => alert('导出 PDF（演示）');
onMounted(() => {
  // 读取学校端写入的 cookie（localhost 跨端口共享）
  try {
    const key = 'fs_pesticide_records';
    const cookie = document.cookie.split('; ').find((c) => c.startsWith(key + '='));
    if (cookie) {
      const arr = JSON.parse(decodeURIComponent(cookie.split('=')[1])) as any[];
      const mapped: Row[] = arr.map((r, idx) => ({
        id: `PT-C${idx + 1}`,
        school: r.school || '示例中学',
        sample: r.sample,
        result: r.result,
        status: r.status,
        at: r.at,
      }));
      rows.value = [...mapped, ...rows.value];
    }
  } catch {}
});
</script>
