<template>
  <div>
    <!-- KPI 概览，风格对齐监管端 -->
    <el-row :gutter="12">
      <el-col :span="4"
        ><el-card
          ><template #header>入库（数量）</template>
          <div class="kpi">{{ kpi.inboundQty ?? 0 }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>出库（数量）</template>
          <div class="kpi">{{ kpi.outboundQty ?? 0 }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>卫生合格率</template>
          <div class="kpi">{{ kpi.hygienePassRate ?? hygienePassRate }}%</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>设备在线率</template>
          <div class="kpi">{{ kpi.deviceOnlineRate ?? deviceOnlineRate }}%</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>AI 预警</template>
          <div class="kpi">{{ aiTotal }}</div></el-card
        ></el-col
      >
      <el-col :span="4"
        ><el-card
          ><template #header>家长满意度</template>
          <div class="kpi">{{ satisfaction }}%</div></el-card
        ></el-col
      >
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>入库/出库</template>
          <el-tabs v-model="ioTab" type="border-card">
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
          <template #header>AI 预警类型分布</template>
          <VChart :option="aiOption" autoresize style="height: 280px; width: 100%" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>卫生上报与设备信息</template>
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
                <template #header>设备信息</template>
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
      <el-col :span="12">
        <el-card>
          <template #header>家长分析（满意度/评价）</template>
          <div style="display: flex; gap: 16px; align-items: center">
            <div>
              <div>平均满意度</div>
              <el-progress type="dashboard" :percentage="satisfaction" :width="120" />
            </div>
            <div style="flex: 1">
              <el-table :data="feedbacks" size="small" border>
                <el-table-column prop="parent" label="家长" width="120" />
                <el-table-column prop="rating" label="评分" width="100" />
                <el-table-column prop="comment" label="评论" />
              </el-table>
              <div style="margin-top: 8px">
                <el-button size="small" @click="exportFeedbackCsv">导出评分明细</el-button>
              </div>
            </div>
          </div>
          <div style="margin-top: 12px">
            <div style="margin-bottom: 6px">评分分布</div>
            <ParentRatingChart :dist="distCount" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>基础信息与待办</template>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-card>
                <template #header>学校基础数据</template>
                <el-descriptions :column="1" size="small" border>
                  <el-descriptions-item label="学校">示例中学</el-descriptions-item>
                  <el-descriptions-item label="食堂">1 号食堂</el-descriptions-item>
                  <el-descriptions-item label="地址">示例路 123 号</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>今日待办</template>
                <div style="display: flex; gap: 6px; margin-bottom: 6px">
                  <el-input
                    v-model="newTask"
                    placeholder="新增待办"
                    size="small"
                    style="width: 140px"
                    @keyup.enter.native="addTask"
                  />
                  <el-button size="small" type="primary" @click="addTask">添加</el-button>
                  <el-button size="small" @click="resetToday">重置</el-button>
                </div>
                <el-checkbox-group v-model="doneIds">
                  <div
                    v-for="t in tasks"
                    :key="t.id"
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      margin: 6px 0;
                    "
                  >
                    <div>
                      <el-checkbox :label="t.id">{{ t.text }}</el-checkbox>
                    </div>
                    <el-button type="danger" text size="small" @click="removeTask(t.id)"
                      >删除</el-button
                    >
                  </div>
                </el-checkbox-group>
                <div style="margin-top: 6px; color: #909399; font-size: 12px">
                  已完成 {{ doneIds.length }}/{{ tasks.length }}
                </div>
              </el-card>
            </el-col>
          </el-row>
          <div style="margin-top: 8px; text-align: right">
            <el-button type="primary" @click="exportPdf">导出今日 PDF</el-button>
            <el-button @click="exportDailyCsv">导出今日 CSV</el-button>
            <el-button @click="refresh">刷新数据</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { api } from '../services/api';
import ParentRatingChart from '../components/ParentRatingChart.vue';
import { exportCsv } from '../utils/export';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);
import { getCurrentSchoolId } from '../utils/school';

// 今日待办：本地可编辑，可持久化
type Task = { id: string; text: string };
const defaultTasks: Task[] = [
  { id: 't1', text: '晨检' },
  { id: 't2', text: '消毒' },
  { id: 't3', text: '留样' },
  { id: 't4', text: '陪餐' },
  { id: 't5', text: '废弃物处理' },
  { id: 't6', text: '卫生检查' },
];
const tasks = ref<Task[]>([]);
const doneIds = ref<string[]>([]);
const newTask = ref('');
const addTask = () => {
  const txt = newTask.value.trim();
  if (!txt) return;
  tasks.value.push({ id: `t${Date.now()}`, text: txt });
  newTask.value = '';
};
const removeTask = (id: string) => {
  tasks.value = tasks.value.filter((t) => t.id !== id);
  doneIds.value = doneIds.value.filter((d) => d !== id);
};
const resetToday = () => {
  tasks.value = [...defaultTasks];
  doneIds.value = [];
  saveDate();
};
const dateKey = 'fs_home_tasks_date';
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function saveDate() {
  localStorage.setItem(dateKey, todayStr());
}
onMounted(() => {
  try {
    const d = localStorage.getItem(dateKey);
    const saved = localStorage.getItem('fs_home_tasks');
    const savedDone = localStorage.getItem('fs_home_tasks_done');
    const isToday = d === todayStr();
    tasks.value = isToday && saved ? JSON.parse(saved) : [...defaultTasks];
    doneIds.value = isToday && savedDone ? JSON.parse(savedDone) : [];
    if (!isToday) saveDate();
  } catch {
    tasks.value = [...defaultTasks];
  }
});
watch(tasks, (v) => localStorage.setItem('fs_home_tasks', JSON.stringify(v)), { deep: true });
watch(doneIds, (v) => localStorage.setItem('fs_home_tasks_done', JSON.stringify(v)));

// 入库/出库数据
const ioTab = ref<'in' | 'out'>('in');
const inbounds = ref<any[]>([]);
const outbounds = ref<any[]>([]);

// 卫生上报与设备
const hygienes = ref<any[]>([]);
const devices = ref<any[]>([]);
const aiTypeData = ref<{ type: string; count: number }[]>([]);
const kpi = ref<any>({});

// 家长分析
const feedbacks = ref<any[]>([]);
const satisfaction = computed(() => {
  const total = feedbacks.value.reduce((s, f) => s + f.rating, 0);
  return Math.round((total / (feedbacks.value.length || 1) / 5) * 100);
});
const distCount = computed<Record<number, number>>(() => {
  const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of feedbacks.value) c[f.rating] = (c[f.rating] || 0) + 1;
  return c;
});
// 图表组件使用 distCount 直接展示分布
const aiTotal = computed(
  () => kpi.value.ai ?? aiTypeData.value.reduce((s, i) => s + (i.count || 0), 0),
);
const hygienePassRate = computed(() => {
  if (!hygienes.value.length) return 100;
  const pass = hygienes.value.filter((h) => h.result === '合格').length;
  return Math.round((pass / hygienes.value.length) * 100);
});
const deviceOnlineRate = computed(() => {
  if (!devices.value.length) return 100;
  const on = devices.value.filter((d) => d.status === '在线').length;
  return Math.round((on / devices.value.length) * 100);
});

const aiOption = computed(() => ({
  grid: { left: 40, right: 20, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: aiTypeData.value.map((i) => i.type) },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: aiTypeData.value.map((i) => i.count),
      itemStyle: { color: '#E6A23C' },
      barWidth: 24,
    },
  ],
}));

// 导出动作占位
const exportPdf = () => alert('导出 PDF（演示）');
const exportDailyCsv = () => alert('导出 CSV（演示）');
const exportFeedbackCsv = () =>
  exportCsv('家长评分明细', feedbacks.value, { parent: '家长', rating: '评分', comment: '评论' });
async function refresh() {
  try {
    const d = await api.schoolDaily(getCurrentSchoolId());
    inbounds.value = d.inbound || [];
    outbounds.value = d.outbound || [];
    hygienes.value = d.hygiene || [];
    devices.value = d.devices || [];
    aiTypeData.value = d.aiByType || [];
    kpi.value = d.kpi || {};
  } catch {
    // 回退到拆分接口
    try {
      const [inb, outb, hyg, dev, evs] = await Promise.all([
        api.inbound(),
        api.outbound(),
        api.hygiene(),
        api.devices(),
        api.schoolEvents(getCurrentSchoolId()),
      ]);
      inbounds.value = inb;
      outbounds.value = outb;
      hygienes.value = hyg;
      devices.value = dev;
      const m: Record<string, number> = {};
      for (const e of evs) m[e.type] = (m[e.type] || 0) + 1;
      aiTypeData.value = Object.entries(m).map(([type, count]) => ({
        type,
        count: count as number,
      }));
    } catch {
      aiTypeData.value = [];
    }
  }
  // 家长反馈可单独获取
  try {
    feedbacks.value = await api.feedback();
  } catch {
    feedbacks.value = [];
  }
}
onMounted(() => {
  refresh();
  window.addEventListener('school-changed', refresh as any);
});
</script>

<style scoped>
.kpi {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
</style>
