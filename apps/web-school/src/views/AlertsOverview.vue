<template>
  <el-card>
    <template #header>预警概览9</template>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <!-- 食堂（学校）选择 -->
      <el-select v-model="schoolId" placeholder="食堂（学校）" clearable filterable style="width: 240px">
        <el-option v-for="s in schools" :key="String(s.id)" :label="s.name" :value="String(s.id)" />
      </el-select>

      <!-- 预警类型（枚举） -->
      <el-select v-model="typeLabel" placeholder="预警类型" clearable style="width: 320px">
        <el-option v-for="opt in TYPE_ENUM" :key="opt.label" :label="opt.label" :value="opt.label" />
      </el-select>

      <!-- 状态（枚举） -->
      <el-select v-model="statusLabel" placeholder="状态" clearable style="width: 160px">
        <el-option v-for="opt in STATUS_ENUM" :key="String(opt.label)" :label="opt.label" :value="opt.label" />
      </el-select>

      <!-- 时间范围：固定枚举 + 自定义 -->
      <el-select v-model="datePreset" placeholder="时间" style="width: 160px">
        <el-option v-for="opt in DATE_ENUM" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-date-picker
        v-if="datePreset === 'custom'"
        v-model="customRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />

      <el-button type="primary" :loading="loading" @click="load">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-row :gutter="8" style="margin-bottom:8px">
      <el-col v-for="s in summary" :key="s.name" :span="6">
        <el-statistic :title="s.name" :value="s.count" />
      </el-col>
    </el-row>

    <el-table :data="warnRows" size="small" border>
      <el-table-column prop="id" label="ID" width="160" />
      <el-table-column prop="type" label="类型" width="220" />
      <el-table-column prop="level" label="等级" width="120" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="at" label="时间" width="200" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';

// 枚举定义
const TYPE_ENUM = [
  { label: '证件过期（供应商、食堂相关）', value: '证件过期' },
  { label: '食材过期预警', value: '食材过期预警' },
  { label: '日常行为AI预警', value: '日常行为AI预警' },
  { label: '环境监测异常', value: '环境监测异常' },
  { label: '农残检测', value: '农残检测' },
  { label: '晨检异常', value: '晨检异常' },
  { label: '健康证到期', value: '健康证到期' },
  { label: '设备安全异常（设备安全检查结果不通过提示异常）', value: '设备安全异常' },
  { label: '消毒管理（当日未提交消毒记录提示异常）', value: '消毒管理' },
] as const;
const STATUS_ENUM = [
  { label: '全部', value: undefined },
  { label: '未处理', value: '未处理' },
  { label: '已处理', value: '已处理' },
] as const;
const DATE_ENUM = [
  { label: '今天', value: 'today' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '自定义', value: 'custom' },
] as const;

const warnRows = ref<Array<{ id: string; type: string; level: string; status: string; at: string }>>([]);
const summary = ref<Array<{ name: string; count: number }>>([]);
const loading = ref(false);
const schoolId = ref<string | undefined>(getCurrentSchoolId());
const schools = ref<Array<{ id: number | string; name: string }>>([]);
const typeLabel = ref<string | undefined>('');
const statusLabel = ref<string | undefined>('');
const datePreset = ref<'today' | '7d' | '30d' | 'custom'>('today');
const customRange = ref<[string, string] | null>(null);

function resolveDateRange(): { start?: string; end?: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toISO = (d: Date) => d.toISOString();
  if (datePreset.value === 'today') {
    const s = startOfDay;
    const e = new Date(startOfDay); e.setDate(e.getDate() + 1);
    return { start: toISO(s), end: toISO(e) };
  }
  if (datePreset.value === '7d') {
    const s = new Date(startOfDay); s.setDate(s.getDate() - 6);
    const e = new Date(startOfDay); e.setDate(e.getDate() + 1);
    return { start: toISO(s), end: toISO(e) };
  }
  if (datePreset.value === '30d') {
    const s = new Date(startOfDay); s.setDate(s.getDate() - 29);
    const e = new Date(startOfDay); e.setDate(e.getDate() + 1);
    return { start: toISO(s), end: toISO(e) };
  }
  if (datePreset.value === 'custom' && customRange.value && customRange.value.length === 2) {
    const [startStr, endStr] = customRange.value;
    const s = new Date(startStr + 'T00:00:00');
    const e = new Date(endStr + 'T23:59:59');
    return { start: toISO(s), end: toISO(e) };
  }
  return {};
}

async function load() {
  loading.value = true;
  try {
    const { start, end } = resolveDateRange();

    const alerts = await api.analyticsAlerts({
      schoolId: schoolId.value,
      type: (TYPE_ENUM.find((t) => t.label === typeLabel.value)?.value) || undefined,
      status: (STATUS_ENUM.find((s) => s.label === statusLabel.value)?.value) as any,
      start, end,
    });
    warnRows.value = alerts.items || [];
    summary.value = alerts.summary || [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  const h = () => { schoolId.value = getCurrentSchoolId(); load(); };
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
  // 加载学校（食堂）下拉
  api.regSchools().then((list) => { schools.value = list || []; }).catch(() => { schools.value = []; });
});

function resetFilters() {
  typeLabel.value = '';
  statusLabel.value = '';
  datePreset.value = 'today';
  customRange.value = null;
  load();
}
</script>
