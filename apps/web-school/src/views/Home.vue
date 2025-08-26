<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <h3>学校基础数据</h3>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="学校">示例中学</el-descriptions-item>
            <el-descriptions-item label="食堂">1 号食堂</el-descriptions-item>
            <el-descriptions-item label="地址">示例路 123 号</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div style="display: flex; align-items: center; justify-content: space-between">
            <h3 style="margin: 0">今日待办</h3>
            <div>
              <el-input
                v-model="newTask"
                placeholder="新增待办"
                size="small"
                style="width: 160px; margin-right: 8px"
                @keyup.enter.native="addTask"
              />
              <el-button size="small" type="primary" @click="addTask">添加</el-button>
              <el-button size="small" @click="resetToday">重置</el-button>
            </div>
          </div>
          <el-divider />
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
              <el-button type="danger" text size="small" @click="removeTask(t.id)">删除</el-button>
            </div>
          </el-checkbox-group>
          <div style="margin-top: 6px; color: #909399; font-size: 12px">
            已完成 {{ doneIds.length }}/{{ tasks.length }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <h3>AI 预警</h3>
          <el-tag type="danger" style="margin-right: 8px">未戴口罩：0</el-tag>
          <el-tag type="warning" style="margin-right: 8px">未戴帽：0</el-tag>
          <el-tag type="info">吸烟：0</el-tag>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <h3>入库/出库</h3>
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
          <h3>卫生上报与设备信息</h3>
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
    </el-row>

    <el-row :gutter="16" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <h3>家长分析（满意度/评价）</h3>
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
          <h3>每日报表快速导出</h3>
          <el-button type="primary" @click="exportPdf">导出 PDF</el-button>
          <el-button @click="exportDailyCsv">导出 CSV</el-button>
          <el-button style="margin-left: 8px" @click="refresh">刷新首页数据</el-button>
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

// 导出动作占位
const exportPdf = () => alert('导出 PDF（演示）');
const exportDailyCsv = () => alert('导出 CSV（演示）');
const exportFeedbackCsv = () =>
  exportCsv('家长评分明细', feedbacks.value, { parent: '家长', rating: '评分', comment: '评论' });
async function refresh() {
  inbounds.value = await api.inbound();
  outbounds.value = await api.outbound();
  hygienes.value = await api.hygiene();
  devices.value = await api.devices();
  feedbacks.value = await api.feedback();
}
onMounted(() => {
  refresh();
});
</script>
