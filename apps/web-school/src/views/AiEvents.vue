<template>
  <el-card class="main-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 18px; font-weight: 600">智能检查/AI 预警 - 违规抓拍明细</span>
        <div>
          <el-button type="primary" size="default" style="transition: all 0.3s" @click="onExportCsv"
            >导出</el-button
          >
        </div>
      </div>
    </template>

    <!-- AI抓拍统计模块 -->
    <el-card
      style="
        margin-bottom: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s;
      "
    >
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-weight: 500">AI抓拍统计</span>
          <el-radio-group
            v-model="statisticsDimension"
            size="small"
            style="border-radius: 4px; overflow: hidden; border: 1px solid #dcdfe6"
            @change="onDimensionChange"
          >
            <el-radio-button label="day" style="border-radius: 0; transition: all 0.3s"
              >日</el-radio-button
            >
            <el-radio-button label="week" style="border-radius: 0; transition: all 0.3s"
              >周</el-radio-button
            >
            <el-radio-button label="month" style="border-radius: 0; transition: all 0.3s"
              >月</el-radio-button
            >
          </el-radio-group>
        </div>
      </template>
      <div style="display: flex; justify-content: space-around; padding: 16px 0">
        <div
          style="
            text-align: center;
            padding: 16px;
            background: #f0f9ff;
            border-radius: 8px;
            flex: 1;
            margin: 0 8px;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid #e6f7ff;
          "
          @mouseenter="
            style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            style.transform = 'translateY(-2px)';
          "
          @mouseleave="
            style.boxShadow = 'none';
            style.transform = 'translateY(0)';
          "
        >
          <div style="font-size: 28px; font-weight: bold; color: #1890ff">{{ totalEvents }}</div>
          <div style="color: #666; margin-top: 4px">总抓拍照数量</div>
        </div>
        <div
          style="
            text-align: center;
            padding: 16px;
            background: #fff1f0;
            border-radius: 8px;
            flex: 1;
            margin: 0 8px;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid #fff1f0;
          "
          @mouseenter="
            style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            style.transform = 'translateY(-2px)';
          "
          @mouseleave="
            style.boxShadow = 'none';
            style.transform = 'translateY(0)';
          "
        >
          <div style="font-size: 28px; font-weight: bold; color: #f56c6c">{{ openEvents }}</div>
          <div style="color: #666; margin-top: 4px">未处理数量</div>
        </div>
        <div
          style="
            text-align: center;
            padding: 16px;
            background: #f0f9f0;
            border-radius: 8px;
            flex: 1;
            margin: 0 8px;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid #f0f9f0;
          "
          @mouseenter="
            style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            style.transform = 'translateY(-2px)';
          "
          @mouseleave="
            style.boxShadow = 'none';
            style.transform = 'translateY(0)';
          "
        >
          <div style="font-size: 28px; font-weight: bold; color: #67c23a">{{ closedEvents }}</div>
          <div style="color: #666; margin-top: 4px">已处理数量</div>
        </div>
      </div>
    </el-card>

    <el-form
      :inline="true"
      :model="filters"
      style="
        margin-bottom: 16px;
        padding: 16px;
        background: #fafafa;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      "
    >
      <el-form-item label="类型" style="margin-right: 16px">
        <el-select
          v-model="filters.type"
          clearable
          filterable
          placeholder="全部"
          style="width: 150px; transition: all 0.3s"
        >
          <el-option v-for="t in types" :key="t.code" :label="t.label" :value="t.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" style="margin-right: 16px">
        <el-select
          v-model="filters.status"
          clearable
          placeholder="全部"
          style="width: 150px; transition: all 0.3s"
        >
          <el-option label="未处理" value="OPEN" />
          <el-option label="已确认" value="ACK" />
          <el-option label="已关闭" value="CLOSED" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="filters.range"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 320px; transition: all 0.3s"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          style="margin-left: 12px; transition: all 0.3s"
          @click="load"
          >查询</el-button
        >
      </el-form-item>
    </el-form>

    <el-table
      :data="rows"
      size="middle"
      border
      style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)"
    >
      <el-table-column prop="id" label="ID" width="110" />
      <el-table-column prop="typeLabel" label="类型" width="120" />
      <el-table-column prop="camera" label="摄像头/通道" width="140" />
      <el-table-column label="快照" width="140">
        <template #default="{ row }">
          <el-image
            v-if="row.snapshot"
            :src="row.snapshot"
            style="
              width: 120px;
              height: 80px;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.3s;
            "
            fit="cover"
            @click="showFullImage(row.snapshot)"
            @mouseenter="
              style.transform = 'scale(1.05)';
              style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            "
            @mouseleave="
              style.transform = 'scale(1)';
              style.boxShadow = 'none';
            "
          />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'OPEN' ? 'warning' : row.status === 'ACK' ? 'info' : 'success'"
            style="cursor: pointer; transition: all 0.3s"
            @click="filterByStatus(row.status)"
            @mouseenter="style.transform = 'scale(1.05)'"
            @mouseleave="style.transform = 'scale(1)'"
          >
            {{ row.status === 'OPEN' ? '未处理' : row.status === 'ACK' ? '已确认' : '已关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="处置" min-width="260">
        <template #default="{ row }">
          <el-input
            v-model="row.measure"
            placeholder="处理措施"
            style="width: 180px; margin-right: 8px; transition: all 0.3s"
          />
          <el-button
            size="small"
            type="primary"
            style="margin-right: 4px; transition: all 0.3s"
            @click="handle(row)"
            >处置</el-button
          >
          <el-button
            v-if="row.status === 'OPEN'"
            size="small"
            style="transition: all 0.3s"
            @click="ack(row)"
            >确认</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top: 16px; display: flex; justify-content: flex-end">
      <el-pagination
        layout="prev, pager, next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="dialogVisible" title="图片预览" width="80%" append-to-body>
      <img
        :src="dialogImageUrl"
        style="
          display: block;
          max-width: 100%;
          max-height: 80vh;
          margin: 0 auto;
          transition: all 0.3s;
        "
      />
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
// 引入Element Plus的ElMessage组件用于显示操作反馈
import { ElMessage } from 'element-plus';

// 对话框相关状态
const dialogVisible = ref(false);
const dialogImageUrl = ref('');

// 显示大图
const showFullImage = (url: string) => {
  dialogImageUrl.value = url;
  dialogVisible.value = true;
};

// 按状态筛选
const filterByStatus = (status: string) => {
  filters.value.status = status;
  page.value = 1;
  load();
};

// 维度切换处理
const onDimensionChange = () => {
  // 这里可以根据需要实现不同维度的数据加载逻辑
  console.log('切换维度:', statisticsDimension.value);
  // 例如可以根据不同维度调整时间范围
  page.value = 1;
  load();
  // 显示切换成功的提示
  ElMessage({
    message: `已切换至${statisticsDimension.value === 'day' ? '日' : statisticsDimension.value === 'week' ? '周' : '月'}维度`,
    type: 'success',
  });
};

type Row = {
  id: string;
  typeCode: string;
  typeLabel: string;
  camera: string;
  snapshot?: string;
  at: string;
  status: 'OPEN' | 'ACK' | 'CLOSED';
  measure?: string;
};
const rows = ref<Row[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const types = ref<Array<{ code: string; label: string }>>([]);
const filters = ref<{
  type?: string;
  status?: 'OPEN' | 'ACK' | 'CLOSED' | '';
  range?: [Date, Date] | null;
}>({ type: undefined, status: '', range: null });
// AI抓拍统计模块相关状态
const statisticsDimension = ref<'day' | 'week' | 'month'>('day'); // 默认展示日维度
// 统计数据
const totalEvents = computed(() => rows.value.length);
const openEvents = computed(() => rows.value.filter((row) => row.status === 'OPEN').length);
const closedEvents = computed(() => rows.value.filter((row) => row.status === 'CLOSED').length);

async function load() {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      schoolId: getCurrentSchoolId(),
    };
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.range && filters.value.range.length === 2) {
      params.start = filters.value.range[0].toISOString();
      params.end = filters.value.range[1].toISOString();
    }
    const res = await api.aiEventsList(params);
    rows.value = res.items;
    total.value = res.total;
  } catch (error) {
    ElMessage({ message: '数据加载失败，请重试', type: 'error' });
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handle(r: Row) {
  if (!r.measure || r.measure.trim() === '') {
    ElMessage({ message: '请输入处理措施', type: 'warning' });
    return;
  }
  try {
    await api.aiEventHandle(r.id, r.measure || '');
    r.status = 'CLOSED';
    ElMessage({ message: '处置成功', type: 'success' });
  } catch (error) {
    ElMessage({ message: '处置失败，请重试', type: 'error' });
    console.error('处置失败:', error);
  }
}
async function ack(r: Row) {
  try {
    await api.aiEventSetStatus(r.id, 'ACK');
    r.status = 'ACK';
    ElMessage({ message: '确认成功', type: 'success' });
  } catch (error) {
    ElMessage({ message: '确认失败，请重试', type: 'error' });
    console.error('确认失败:', error);
  }
}
function onPage(p: number) {
  page.value = p;
  load();
}

async function init() {
  try {
    types.value = await api.aiTypes();
    await load();
  } catch (error) {
    ElMessage({ message: '初始化失败，请刷新页面重试', type: 'error' });
    console.error('初始化失败:', error);
  }
}

const onExportCsv = () => {
  try {
    if (rows.value.length === 0) {
      ElMessage({ message: '暂无数据可导出', type: 'warning' });
      return;
    }
    exportCsv('AI违规抓拍', rows.value as any, {
      id: 'ID',
      typeLabel: '类型',
      camera: '通道',
      snapshot: '快照',
      at: '时间',
      measure: '处置',
    });
    ElMessage({ message: '导出成功', type: 'success' });
  } catch (error) {
    ElMessage({ message: '导出失败，请重试', type: 'error' });
    console.error('导出失败:', error);
  }
};

let off: any = null;
onMounted(() => {
  init();
  const h = () => {
    page.value = 1;
    load();
  };
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  try {
    off?.();
  } catch {}
});
</script>

<style scoped>
.main-card {
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.el-table th {
  background-color: #fafafa !important;
  font-weight: 600;
}

.el-table tr:hover {
  background-color: #f0f9ff !important;
}

.el-select:hover,
.el-input:hover,
.el-date-picker:hover {
  border-color: #409eff !important;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 优化滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>
