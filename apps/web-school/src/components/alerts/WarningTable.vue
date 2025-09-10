<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0">
      <div>
        <el-button type="success" :disabled="!selectedIds.length" @click="batchMark">批量标记已处理</el-button>
      </div>
      <div>
        <el-button :icon="Download" @click="doExport">导出</el-button>
      </div>
    </div>

    <el-table :data="items" border  @selection-change="onSel">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="type" label="预警类型" width="220" />
      <el-table-column prop="title" label="预警标题" />
      <el-table-column prop="location" label="触发主体/位置" width="220" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === '未处理' ? 'danger' : 'success'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :type="row.status === '未处理' ? 'primary' : 'default'" @click="handleOne(row)">
            {{ row.status === '未处理' ? '处理' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { useWarningStore } from '../../stores/warning';
import { exportCsv } from '../../utils/export';

const store = useWarningStore();

const items = computed(() => store.items);
const summary = computed(() => store.summary);
const selectedIds = computed(() => store.selected);

function fmt(iso?: string) {
  try {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso as any;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso as any;
  }
}

function onSel(rows: any[]) { store.setSelection(rows.map((r) => r.id)); }
function batchMark() { store.markAsProcessed(selectedIds.value); }
function handleOne(row: any) {
  if (row.status === '未处理') store.markAsProcessed([row.id]);
}
function doExport() {
  const rows = items.value.map((r) => ({ ...r, at: fmt(r.at) }));
  exportCsv('预警概览', rows, {
    type: '预警类型',
    title: '预警标题',
    location: '触发主体/位置',
    at: '时间',
    status: '状态',
  });
}
</script>
