<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>明厨亮灶监管</span>
        <div>
          <el-button @click="onExportCsv">导出通道列表</el-button>
        </div>
      </div>
    </template>
    <el-tabs v-model="tab">
      <el-tab-pane label="实时" name="live">
        <el-table :data="cameras" size="small" border>
          <el-table-column prop="id" label="通道ID" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="school" label="学校" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="preview(row)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="回放" name="playback">
        <el-form :inline="true" :model="query">
          <el-form-item label="通道"><el-input v-model="query.camera" /></el-form-item>
          <el-form-item label="时间"
            ><el-date-picker v-model="query.range" type="datetimerange"
          /></el-form-item>
          <el-form-item><el-button @click="search">查询</el-button></el-form-item>
        </el-form>
        <el-empty description="回放结果占位" />
      </el-tab-pane>
      <el-tab-pane label="快照" name="snapshots">
        <el-table :data="snaps" size="small" border>
          <el-table-column prop="id" label="快照ID" width="120" />
          <el-table-column prop="camera" label="通道" />
          <el-table-column prop="at" label="时间" width="180" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
type Cam = { id: string; name: string; school: string };
const tab = ref('live');
const cameras = ref<Cam[]>([
  { id: 'CH-001', name: '后厨-操作台', school: '示例一中' },
  { id: 'CH-002', name: '后厨-清洗区', school: '示例二小' },
]);
const snaps = ref([{ id: 'SN-001', camera: 'CH-001', at: new Date().toLocaleString() }]);
const query = ref<{ camera: string; range: [Date, Date] | null }>({ camera: '', range: null });
const preview = (row: Cam) => alert(`预览 ${row.name}（演示）`);
const search = () => alert('查询回放（演示）');
const onExportCsv = () =>
  exportCsv('通道列表', cameras.value as any, { id: '通道ID', name: '名称', school: '学校' });
</script>
