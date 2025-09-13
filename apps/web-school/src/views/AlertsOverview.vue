<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>预警概览</div>
        <div style="display:flex;align-items:center;gap:16px;font-size:13px;color:#666">
          <div>今日预警总数：<b style="font-size:16px;color:#d03050">{{ todayTotal }}</b> 条</div>
          <div>当前时间：{{ nowText }}</div>
        </div>
      </div>
    </template>
    <el-form :inline="true" label-width="84px" style="margin-bottom:12px">

      <el-form-item label="食堂">
        <el-select v-model="canteenId" placeholder="全部" clearable filterable style="width: 120px">
          <el-option v-for="c in canteens" :key="String(c.id)" :label="c.name" :value="Number(c.id)" />
        </el-select>
      </el-form-item>

      <el-form-item label="预警类型">
        <el-select v-model="typeLabels" placeholder="选择类型" multiple collapse-tags collapse-tags-tooltip clearable style="width: 220px">
          <el-option v-for="opt in TYPE_ENUM" :key="opt.label" :label="opt.label" :value="opt.label" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="statusLabel" placeholder="全部" clearable style="width: 160px">
          <el-option v-for="opt in STATUS_ENUM" :key="String(opt.label)" :label="opt.label" :value="opt.label" />
        </el-select>
      </el-form-item>

      <el-form-item label="时间范围">
        <el-date-picker
          v-model="customRange"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :shortcuts="dateShortcuts"
          style="width: 320px"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="8" class="summary-tiles">
      <el-col v-for="(s, idx) in summary" :key="s.name" :span="6">
        <div class="stat-tile" :class="tileClass(idx)">
          <div class="num">{{ s.count }}</div>
          <div class="label">{{ s.name }}</div>
        </div>
      </el-col>
    </el-row>

    <div style="display:flex;justify-content:flex-end;gap:20px;align-items:center;margin:8px 0">
      <div>
        <el-button type="success" :disabled="!selectedIds.length" @click="batchMark">批量标记已处理</el-button>
      </div>
      <div>
        <el-button @click="doExport">导出 </el-button>
      </div>
    </div>

    <el-table :data="pagedRows" border @selection-change="onSel" :empty-text="loading ? '加载中…' : '暂无数据'">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="type" label="类型" width="200">
        <template #default="{ row }">
          <el-tag type="info">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="等级" width="120">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === '未处理' ? 'danger' : 'success'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="detail" label="描述" min-width="260" show-overflow-tooltip />
      <el-table-column label="日期" width="140">
        <template #default="{ row }">{{ dateOnly(row.at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button  :type="row.status === '未处理' ? 'primary' : 'default'" @click="handleOne(row)">
            {{ row.status === '未处理' ? '处理' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10,20,50,100]"
        :page-size="pageSize"
        :current-page="page"
        :total="warnRows.length"
        @size-change="(s:number)=>{ pageSize=s; page=1; }"
        @current-change="(p:number)=>{ page=p; }"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { dateOnly } from '../utils/datetime';
import { getCurrentSchoolId } from '../utils/school';
import { exportCsv } from '../utils/export';

// 枚举定义
const TYPE_ENUM = [
  { label: '资质证书过期', value: '资质证书过期' },
  { label: '食材过期预警', value: '食材过期预警' },
  { label: '日常行为AI预警', value: '日常行为AI预警' },
  { label: '环境监测异常', value: '环境监测异常' },
  { label: '农残检测', value: '农残检测' },
  { label: '晨检异常', value: '晨检异常' },
  { label: '设备安全异常', value: '设备安全异常' },
  { label: '消毒管理', value: '消毒管理' },
] as const;
const STATUS_ENUM = [
  { label: '全部', value: undefined },
  { label: '未处理', value: '未处理' },
  { label: '已处理', value: '已处理' },
] as const;
const warnRows = ref<Array<{ id: string; type: string; level: string; status: string; at: string; detail?: string; canteenId?: number }>>([]);
const summary = ref<Array<{ name: string; count: number }>>([]);
const loading = ref(false);
const schoolId = ref<string | undefined>(getCurrentSchoolId());
const typeLabels = ref<string[] | undefined>(undefined);
const statusLabel = ref<string | undefined>('');
const customRange = ref<[string, string] | null>(null);
const canteenId = ref<number | undefined>(undefined);
const canteens = ref<Array<{ id: number | string; name: string }>>([]);
const page = ref(1);
const pageSize = ref(20);
const selectedIds = ref<string[]>([]);
const pagedRows = computed(() => warnRows.value.slice((page.value - 1) * pageSize.value, (page.value - 1) * pageSize.value + pageSize.value));

// Summary tile class mapping，模仿 AI 抓拍统计样式
function tileClass(idx: number) {
  const map = ['primary', 'danger', 'success'];
  return map[idx % map.length];
}

function fmt(iso?: string) {
  try {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return String(iso || ''); }
}

const nowText = ref('');
const todayTotal = ref(0);
let timer: any;
const router = useRouter();
function tickNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  nowText.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function levelTagType(level?: string) {
  if (!level) return 'info';
  if (level.includes('高')) return 'danger';
  if (level.includes('中')) return 'warning';
  return 'info';
}
function onSel(rows: any[]) { selectedIds.value = rows.map((r) => r.id); }
async function batchMark() {
  const ids = new Set(selectedIds.value);
  const tasks = warnRows.value.filter((r) => ids.has(r.id) && r.status === '未处理')
    .map((r) => api.analyticsAlertHandle({ id: r.id, type: r.type, measure: '已处理' }).catch(() => null));
  await Promise.all(tasks);
  warnRows.value = warnRows.value.map((r) => (ids.has(r.id) ? { ...r, status: '已处理' } : r));
}
async function handleOne(row: any) {
  if (row.status === '未处理') {
    try {
      await api.analyticsAlertHandle({ id: row.id, type: row.type, measure: '已处理' });
      row.status = '已处理';
    } catch {}
    return;
  }
  const t: string = row.type || '';
  if (t.includes('AI') || t === '日常行为AI预警') {
    router.push({ path: '/ai/events' });
    return;
  }
  if (t.includes('消毒')) { router.push({ path: '/daily-op/disinfection' }); return; }
  if (t.includes('农残')) { router.push({ path: '/daily-op/pesticide-tests' }); return; }
  if (t.includes('设备安全')) { router.push({ path: '/daily-op/device-safety' }); return; }
  if (t.includes('环境')) { router.push({ path: '/daily-op/environment' }); return; }
  if (t.includes('资质证书过期')) {
    if ((row as any).origType && String((row as any).origType).includes('健康证')) {
      router.push({ path: '/hr/staff' });
    } else {
      router.push({ path: '/hr/canteen-licenses' });
    }
    return;
  }
}
function doExport() {
  const rows = warnRows.value.map((r) => ({ id: r.id, type: r.type, detail: r.detail || '', at: dateOnly(r.at), status: r.status }));
  exportCsv('预警概览', rows, { id: 'ID', type: '类型', detail: '描述', at: '时间', status: '状态' });
}

const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const d = new Date();
      const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const e = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return [s, e] as [Date, Date];
    },
  },
  {
    text: '近7天',
    value: () => {
      const d = new Date();
      const e = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const s = new Date(e); s.setDate(s.getDate() - 6);
      return [s, e] as [Date, Date];
    },
  },
  {
    text: '近30天',
    value: () => {
      const d = new Date();
      const e = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const s = new Date(e); s.setDate(s.getDate() - 29);
      return [s, e] as [Date, Date];
    },
  },
] as any;

function resolveDateRange(): { start?: string; end?: string } {
  const toISO = (d: Date) => d.toISOString();
  if (customRange.value && customRange.value.length === 2) {
    const [startStr, endStr] = customRange.value;
    const s = new Date(startStr + 'T00:00:00');
    const e = new Date(endStr + 'T23:59:59');
    return { start: toISO(s), end: toISO(e) };
  }
  // 默认：今天
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return { start: toISO(s), end: toISO(e) };
}

function recomputeSummary(rows: Array<{ type?: string }>) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const key = (r.type && String(r.type).trim()) || '其他';
    map.set(key, (map.get(key) || 0) + 1);
  });
  summary.value = Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

async function load() {
  loading.value = true;
  try {
    const { start, end } = resolveDateRange();

    const alerts = await api.analyticsAlerts({
      schoolId: schoolId.value,
      // 多选类型：后端仅支持单选，先取全量后前端过滤
      status: (STATUS_ENUM.find((s) => s.label === statusLabel.value)?.value) as any,
      start, end,
      canteenId: canteenId.value,
    } as any);
    let rows = (alerts.items || []) as Array<any>;
    // 合并后端“证件过期/健康证到期”为统一类型“资质证书过期”
    rows = rows.map((r) => ({ ...r, type: (r.type === '证件过期' || r.type === '健康证到期') ? '资质证书过期' : r.type }));
    if (Array.isArray(typeLabels.value) && typeLabels.value.length) {
      const selValues = typeLabels.value
        .map((lab) => TYPE_ENUM.find((t) => t.label === lab)?.value)
        .filter(Boolean);
      rows = rows.filter((r) => selValues.includes(r.type));
    }
    if (canteenId.value) rows = rows.filter((r) => !('canteenId' in r) || r.canteenId === canteenId.value);
    warnRows.value = rows as any;
    recomputeSummary(rows as any);
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    const todayLocal = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    todayTotal.value = warnRows.value.filter((x) => {
      try {
        const dt = new Date(String(x.at || ''));
        const ds = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
        return ds === todayLocal;
      } catch { return false; }
    }).length;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  tickNow();
  timer = setInterval(tickNow, 30000);
  const h = () => { schoolId.value = getCurrentSchoolId(); load(); };
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
  // 学校由登录上下文确定，移除学校下拉；仅按当前学校加载食堂
  // 加载食堂列表
  if (schoolId.value) api.canteensList(String(schoolId.value)).then((list)=> { canteens.value = list || []; }).catch(()=> { canteens.value = []; });
});

function resetFilters() {
  typeLabels.value = undefined;
  statusLabel.value = '';
  customRange.value = null;
  canteenId.value = undefined;
  load();
}

watch(schoolId, (v) => {
  canteens.value = [];
  canteenId.value = undefined;
  if (v) api.canteensList(String(v)).then((list)=> { canteens.value = list || []; }).catch(()=> { canteens.value = []; });
});

onBeforeUnmount(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.summary-tiles { margin-bottom: 8px;  }
.stat-tile {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  background: #fff;
  transition: all .25s ease;
  cursor: default;
}
.stat-tile .num { font-size: 28px; font-weight: 800; }
.stat-tile .label { color: #666; margin-top: 4px; }
.stat-tile:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }

/* Variants inspired by AI抓拍统计 */
.stat-tile.primary { background: #f0f9ff; border-color: #e6f7ff; }
.stat-tile.primary .num { color: #1890ff; }
.stat-tile.danger { background: #fff1f0; border-color: #fff1f0; }
.stat-tile.danger .num { color: #f56c6c; }
.stat-tile.success { background: #f0f9f0; border-color: #f0f9f0; }
.stat-tile.success .num { color: #67c23a; }

@media (max-width: 992px) {
  .stat-tile .num { font-size: 24px; }
}
</style>
