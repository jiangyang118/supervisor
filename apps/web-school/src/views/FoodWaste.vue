<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食品浪费管理</span>
        <div>
          <el-button @click="onExportCsv">导出明细</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="来源">
        <el-select v-model="filters.source" placeholder="请选择" clearable style="width: 160px">
          <el-option label="全部" value="" />
          <el-option label="库存损耗" value="库存损耗" />
          <el-option label="加工制作损耗" value="加工制作损耗" />
          <el-option label="剩菜剩饭损耗" value="剩菜剩饭损耗" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels />
      </el-form-item>
      <el-form-item>
        <el-button @click="load">查询</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>浪费来源统计</template>
          <el-table :data="statsSource" size="small" border>
            <el-table-column prop="source" label="类别" />
            <el-table-column prop="weightKg" label="重量(kg)" width="120" />
            <el-table-column prop="amountYuan" label="金额(元)" width="120" />
          </el-table>
          <v-chart
            :option="chartSource"
            autoresize
            style="height: 260px; width: 100%; margin-top: 8px"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>明细</template>
          <el-table :data="details" size="small" border>
            <el-table-column prop="date" label="日期" width="170">
              <template #default="{ row }">{{ formatTime(row.date) }}</template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="140" />
            <el-table-column prop="itemType" label="类型" width="100" />
            <el-table-column prop="itemName" label="名称" />
            <el-table-column prop="weightKg" label="重量(kg)" width="120" />
            <el-table-column prop="amountYuan" label="金额(元)" width="120" />
            <el-table-column prop="reason" label="原因" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </el-card>

  <!-- 原因管理 -->
  <el-dialog v-model="reasonDlg" title="原因管理" width="560px">
    <div style="margin-bottom: 8px">
      <el-input
        v-model="newReason"
        placeholder="新增原因"
        style="width: 300px; margin-right: 8px"
      />
      <el-button type="primary" @click="addReason">添加</el-button>
    </div>
    <el-table :data="reasons" size="small" border>
      <el-table-column prop="name" label="原因" />
      <el-table-column label="启用" width="120">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            @change="(v: boolean) => setReasonEnabled(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="delReason(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="reasonDlg = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { use } from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);
const vChart = VChart;
const statsSource = ref<any[]>([]);
const details = ref<any[]>([]);
const filters = ref<{
  source: '' | '库存损耗' | '加工制作损耗' | '剩菜剩饭损耗';
  range: [Date, Date] | null;
}>({
  source: '',
  range: null,
});
const reasons = ref<any[]>([]);
const reasonDlg = ref(false);
const newReason = ref('');
async function load() {
  const params: any = {};
  if (filters.value.source) params.source = filters.value.source;
  if (filters.value.range && filters.value.range.length === 2) {
    params.start = filters.value.range[0].toISOString();
    params.end = filters.value.range[1].toISOString();
  }
  const sum = await api.foodWasteSummary(params);
  statsSource.value = sum.bySource || [];
  const rec = await api.foodWasteRecords(params);
  details.value = rec.items || [];
  reasons.value = await api.foodWasteReasons();
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
const onExportCsv = () =>
  exportCsv('食品浪费明细', details.value as any, {
    date: '日期',
    source: '来源',
    itemType: '类型',
    itemName: '名称',
    weightKg: '重量(kg)',
    amountYuan: '金额(元)',
    reason: '原因',
  });
load();

const chartSource = computed(() => {
  const series = statsSource.value.map((s: any) => ({ name: s.source, value: s.weightKg }));
  return {
    tooltip: { trigger: 'item' },
    legend: { top: '2%' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {c}kg' },
        data: series,
      },
    ],
  };
});

async function addReason() {
  const n = newReason.value.trim();
  if (!n) return;
  await api.foodWasteReasonCreate(n);
  newReason.value = '';
  reasons.value = await api.foodWasteReasons();
}
async function setReasonEnabled(row: any, v: boolean) {
  await api.foodWasteReasonEnable(row.id, v);
  reasons.value = await api.foodWasteReasons();
}
async function delReason(row: any) {
  await api.foodWasteReasonDelete(row.id);
  reasons.value = await api.foodWasteReasons();
}
</script>
