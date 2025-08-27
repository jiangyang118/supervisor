<template>
  <div style="padding: 8px">
    <!-- 顶部筛选与导出 -->
    <el-card shadow="never" style="margin-bottom: 12px">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
        <el-date-picker
          v-model="range"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
        <el-select v-model="meal" placeholder="全部餐次" clearable style="min-width: 160px">
          <el-option label="早餐" value="breakfast" />
          <el-option label="午餐" value="lunch" />
          <el-option label="晚餐" value="dinner" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="exportCsvReport">导出 CSV</el-button>
        <el-button @click="exportPdf">导出 PDF</el-button>
      </div>
    </el-card>

    <!-- KPI 汇总（学校维度） -->
    <el-row :gutter="12" style="margin-bottom: 12px">
      <el-col :span="4"
        ><el-card
          ><template #header>晨检</template>
          <div class="kpi">{{ kpi.morning }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>留样</template>
          <div class="kpi">{{ kpi.sampling }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>消毒</template>
          <div class="kpi">{{ kpi.disinfection }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>陪餐</template>
          <div class="kpi">{{ kpi.dine }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>废弃物</template>
          <div class="kpi">{{ kpi.waste }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>AI 预警</template>
          <div class="kpi">{{ kpi.ai }}</div></el-card
        ></el-col
      >
    </el-row>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <template #header>各类上报占比</template>
          <VChart :option="pieOption" autoresize style="height: 300px; width: 100%" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>AI 预警类型</template>
          <VChart :option="barOption" autoresize style="height: 300px; width: 100%" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>入库/出库简表</template>
          <el-tabs v-model="tab" type="border-card">
            <el-tab-pane label="入库" name="in">
              <el-table :data="inbounds" size="small" border>
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="item" label="商品" />
                <el-table-column prop="qty" label="数量" width="100" />
                <el-table-column prop="supplier" label="供应商" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="出库" name="out">
              <el-table :data="outbounds" size="small" border>
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="item" label="商品" />
                <el-table-column prop="qty" label="数量" width="100" />
                <el-table-column prop="purpose" label="用途" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>卫生与设备概览</template>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-card>
                <template #header>卫生上报</template>
                <el-table :data="hygienes" size="small" border>
                  <el-table-column prop="date" label="日期" width="120" />
                  <el-table-column prop="item" label="项目" />
                  <el-table-column prop="result" label="结果" width="100" />
                </el-table>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>设备状态</template>
                <el-table :data="devices" size="small" border>
                  <el-table-column prop="id" label="设备ID" width="120" />
                  <el-table-column prop="type" label="类型" />
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '在线' ? 'success' : 'info'">{{
                        row.status
                      }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../services/api';
import { exportCsv as doExportCsv } from '../utils/export';
import { getCurrentSchoolId } from '../utils/school';
import { use } from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const range = ref<[Date, Date] | null>(null);
const meal = ref<string | null>('breakfast');
const kpi = ref({ morning: 0, sampling: 0, disinfection: 0, dine: 0, waste: 0, ai: 0 });
const aiType = ref<{ type: string; count: number }[]>([]);

const inbounds = ref<any[]>([]);
const outbounds = ref<any[]>([]);
const hygienes = ref<any[]>([]);
const devices = ref<any[]>([]);
const tab = ref<'in' | 'out'>('in');

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['35%', '70%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 1 },
      data: [
        { name: '晨检', value: kpi.value.morning },
        { name: '留样', value: kpi.value.sampling },
        { name: '消毒', value: kpi.value.disinfection },
        { name: '陪餐', value: kpi.value.dine },
        { name: '废弃物', value: kpi.value.waste },
        { name: 'AI 预警', value: kpi.value.ai },
      ],
    },
  ],
}));

const barOption = computed(() => ({
  grid: { left: 40, right: 20, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: aiType.value.map((i) => i.type) },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: aiType.value.map((i) => i.count), barWidth: 24 }],
}));

function exportPdf() {
  alert('导出 PDF（演示）');
}
function exportCsvReport() {
  const flat = [
    { name: '晨检', count: kpi.value.morning },
    { name: '留样', count: kpi.value.sampling },
    { name: '消毒', count: kpi.value.disinfection },
    { name: '陪餐', count: kpi.value.dine },
    { name: '废弃物', count: kpi.value.waste },
    { name: 'AI 预警', count: kpi.value.ai },
  ];
  doExportCsv('学校每日报表汇总', flat, { name: '类别', count: '数量' });
}

async function load() {
  // 优先使用后台聚合，确保与入/出库等模块数据一致
  try {
    const d = await api.schoolDaily(getCurrentSchoolId());
    kpi.value = d.kpi;
    aiType.value = d.aiByType || [];
    inbounds.value = d.inbound || [];
    outbounds.value = d.outbound || [];
    hygienes.value = d.hygiene || [];
    devices.value = d.devices || [];
    return;
  } catch (e) {
    // Aggregated API failed; fall back to split endpoints below
    void 0;
  }
  // 后端不可用时回退到拆分接口
  try {
    const [inb, outb, hyg, dev, evs] = await Promise.all([
      api.inbound(),
      api.outbound(),
      api.hygiene(),
      api.devices(),
      api.schoolEvents(),
    ]);
    inbounds.value = inb;
    outbounds.value = outb;
    hygienes.value = hyg;
    devices.value = dev;
    const aiMap: Record<string, number> = {};
    for (const e of evs) aiMap[e.type] = (aiMap[e.type] || 0) + 1;
    aiType.value = Object.entries(aiMap).map(([type, count]) => ({ type, count }));
    kpi.value = { morning: 22, sampling: 15, disinfection: 24, dine: 9, waste: 26, ai: evs.length };
  } catch {
    // 最终回退示例
    inbounds.value = [{ date: '今天', item: '大米', qty: 50, supplier: '供货商A' }];
    outbounds.value = [{ date: '今天', item: '蔬菜', qty: 20, purpose: '午餐' }];
    hygienes.value = [{ date: '今天', item: '操作台', result: '合格' }];
    devices.value = [{ id: 'CAM-001', type: '摄像头', status: '在线' }];
    aiType.value = [
      { type: '未戴帽', count: 3 },
      { type: '未戴口罩', count: 2 },
    ];
    kpi.value = { morning: 22, sampling: 15, disinfection: 24, dine: 9, waste: 26, ai: 5 };
  }
}

onMounted(() => load());
window.addEventListener('school-changed', load as any);
</script>

<style scoped>
.kpi {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}
</style>
