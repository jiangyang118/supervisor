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
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="24">
        <el-card>
          <template #header>入库/出库</template>
          <el-tabs v-model="ioTab" type="border-card">
            <el-tab-pane label="入库" name="in">
              <el-table :data="inventoryInbounds" size="small" border>
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="item" label="商品" />
                <el-table-column prop="qty" label="数量" width="100" />
                <el-table-column prop="supplier" label="供应商" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="出库" name="out">
              <el-table :data="inventoryOutbounds" size="small" border>
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="item" label="商品" />
                <el-table-column prop="qty" label="数量" width="100" />
                <el-table-column prop="purpose" label="用途" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
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
                  <el-table-column prop="by" label="检查人" />
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
          <template #header>基础信息与待办</template>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-card>
                <template #header>学校基础数据</template>
                <el-descriptions :column="1" size="small" border>
                  <el-descriptions-item label="食堂">{{ canteen?.name || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="负责人">{{ canteen?.manager || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="联系电话">{{ canteen?.phone || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="地址">{{ canteen?.address || '-' }}</el-descriptions-item>
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
// Removed mock charts and ECharts imports
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

// 入库/出库数据 - 从专用模块获取，确保数据一致性
const ioTab = ref<'in' | 'out'>('in');
const inventoryInbounds = ref<any[]>([]);
const inventoryOutbounds = ref<any[]>([]);

// 卫生上报与设备
const hygienes = ref<any[]>([]);
const devices = ref<any[]>([]);
const kpi = ref<any>({});

// 基础信息（食堂）
const canteen = ref<any | null>(null);
// 图表组件使用 distCount 直接展示分布
const aiTotal = computed(() => Number(kpi.value.ai || 0));
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

// Removed AI type distribution chart

// 导出动作占位
// 去除演示导出按钮

// 格式化库存数据为概览页所需格式
const formatInventoryData = (inventoryData: any[], type: 'in' | 'out') => {
  return inventoryData.map((item) => {
    // 提取产品名称、供应商名称等显示信息
    const itemName = item.product?.name || item.productId; // 优先使用关联的产品名称
    const supplierName = item.supplier?.name || item.supplierId || '未知供应商';
    const purpose = item.purpose || '日常使用';

    // 构造适合概览页显示的数据结构
    return {
      id: item.id,
      date: item.date || new Date().toISOString().slice(0, 10),
      item: itemName,
      qty: item.qty || 0,
      supplier: type === 'in' ? supplierName : undefined,
      purpose: type === 'out' ? purpose : undefined,
      // 保留原始数据，便于后续扩展
      originalData: item,
    };
  });
};

// 计算KPI数据 - 统一从模块数据计算
const calculateKpi = (inbounds: any[], outbounds: any[]) => {
  // 计算今日入库总量
  const today = new Date().toISOString().slice(0, 10);
  const todayInbounds = inbounds.filter((item) => item.date === today);
  const todayOutbounds = outbounds.filter((item) => item.date === today);

  const inboundSum = todayInbounds.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const outboundSum = todayOutbounds.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  return {
    inboundQty: Math.round(inboundSum),
    outboundQty: Math.round(outboundSum),
    // 其他KPI指标也可以从各模块数据中计算
    hygienePassRate: hygienePassRate.value,
    deviceOnlineRate: deviceOnlineRate.value,
    ai: aiTotal.value,
  };
};

// 优化数据获取逻辑，确保与模块数据一致性
async function refresh() {
  const schoolId = getCurrentSchoolId();
  try {
    // 并行获取各个模块的数据
  const [
      inventoryInboundData,
      inventoryOutboundData,
      hygienePage,
      deviceData,
      stockData,
    ] = await Promise.all([
      api.invInboundList(schoolId), // 使用入库模块的API
      api.invOutboundList(schoolId), // 使用出库模块的API
      api.schoolHygieneInspections({ schoolId, page: 1, pageSize: 10 }),
      api.schoolDevices(schoolId),
      api.invStock(schoolId), // 获取库存数据，用于完整性检查
    ]);

    // 格式化模块数据为概览页所需格式
    inventoryInbounds.value = formatInventoryData(inventoryInboundData || [], 'in');
    inventoryOutbounds.value = formatInventoryData(inventoryOutboundData || [], 'out');

    // 设置其他模块数据
    hygienes.value = (hygienePage?.items as any[]) || [];
    devices.value = deviceData || [];
    // 基础信息
    try { canteen.value = await api.sysCanteenGet(); } catch {}

    // 移除 AI 预警类型分布模块

    // 从模块数据计算KPI指标，确保数据一致性
    kpi.value = calculateKpi(inventoryInbounds.value, inventoryOutbounds.value);

    console.log('数据刷新完成，概览页数据已与模块数据同步');
  } catch (error) {
    console.error('数据刷新失败:', error);

    // 彻底失败时的空数据处理
    inventoryInbounds.value = [];
    inventoryOutbounds.value = [];
    hygienes.value = [];
    devices.value = [];
    kpi.value = {};
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
