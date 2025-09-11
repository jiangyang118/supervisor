<template>
  <div class="ai-summary-container">
    <div class="page-header">
      <h2 class="page-title">智能检查/AI 预警 - 违规抓拍统计</h2>
      <el-button
        type="primary"
        :loading="loading.exporting"
        class="export-btn"
        @click="onExportCsv"
      >
        <el-icon><Download /></el-icon>
        导出统计数据
      </el-button>
    </div>

    <el-form :inline="true" :model="filters" class="search-form">
      <el-form-item label="统计维度：">
        <el-select v-model="filters.dim" class="filter-select" @change="query">
          <el-option label="按日" value="day" />
          <el-option label="按周" value="week" />
          <el-option label="按月" value="month" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围：">
        <el-date-picker
          v-model="filters.range"
          type="daterange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          range-separator="至"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="date-picker"
          @change="query"
        />
      </el-form-item>
    </el-form>

    <div class="stats-cards">
      <el-card v-for="row in rows" :key="row.type" class="stat-card">
        <div class="stat-content">
          <div class="stat-title">{{ row.type }}</div>
          <div class="stat-count">{{ row.count }}</div>
          <div class="stat-status">
            <el-tag :type="row.status === 'OPEN' ? 'danger' : 'success'" >
              {{ row.status === 'OPEN' ? '未处理' : '已处理' }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <div class="table-container">
      <el-table v-loading="loading.table" :data="tableData" stripe class="stats-table">
        <el-table-column prop="date" label="日期" min-width="120" />
        <el-table-column prop="type" label="违规类型" min-width="100" />
        <el-table-column prop="count" label="违规数量" min-width="80" align="right" />
        <el-table-column prop="status" label="状态" min-width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'OPEN' ? 'danger' : 'success'" >
              {{ scope.row.status === 'OPEN' ? '未处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { api } from '../services/api';

// 加载状态管理
const loading = reactive({
  table: false,
  exporting: false,
});

// 筛选条件
const filters = reactive({
  dim: 'day' as 'day' | 'week' | 'month',
  range: null as [string, string] | null,
});

// 统计数据
const rows = ref<any[]>([]);
const tableData = ref<any[]>([]);

// 查询数据
const query = async () => {
  try {
    loading.table = true;

    const params = {
      dim: filters.dim,
      start: filters.range?.[0],
      end: filters.range?.[1],
    };

    // 使用新的API接口获取统计数据
    const data = await api.aiEventsSummary(params);

    // 设置统计卡片数据
    rows.value = data;

    // 设置表格数据
    tableData.value = data;

    // 如果没有数据，显示提示信息
    if (data.length === 0) {
      ElMessage.info('当前筛选条件下暂无数据');
    }
  } catch (error) {
    console.error('查询统计数据失败:', error);
    ElMessage.error('查询统计数据失败，请稍后重试');
    // 显示模拟数据作为备用
    showMockData();
  } finally {
    loading.table = false;
  }
};

// 显示模拟数据（作为备用）
const showMockData = () => {
  const mockData = [
    { date: '2023-10-01', type: '未戴帽', count: 12, status: 'OPEN' },
    { date: '2023-10-01', type: '打电话', count: 5, status: 'CLOSED' },
  ];
  rows.value = mockData;
  tableData.value = mockData;
};

// 导出CSV
const onExportCsv = async () => {
  try {
    loading.exporting = true;

    const params = {
      dim: filters.dim,
      start: filters.range?.[0],
      end: filters.range?.[1],
    };

    const csv = await api.aiEventsSummaryExportCsv(params);

    // 创建Blob对象并下载
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `AI违规抓拍统计_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出CSV失败:', error);
    ElMessage.error('导出失败，请稍后重试');
  } finally {
    loading.exporting = false;
  }
};

// 组件挂载时查询数据
onMounted(() => {
  query();
});
</script>

<style scoped>
.ai-summary-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.export-btn {
  background-color: #1890ff;
  border-color: #1890ff;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.search-form {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-select {
  width: 120px;
}

.date-picker {
  width: 300px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #ffffff, #f0f2f5);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
  padding: 24px 16px;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-count {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.stat-status {
  margin-top: 4px;
}

.table-container {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-table {
  width: 100%;
}

/* 滚动条样式优化 */
:deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
