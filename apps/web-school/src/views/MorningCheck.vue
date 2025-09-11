<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>晨检管理</span>
        <div class="actions">
          <el-date-picker v-model="date" type="date" placeholder="选择日期" style="margin-right:8px" />
          <el-select v-model="canteenId" placeholder="选择食堂" style="width:200px; margin-right:8px">
            <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button type="primary" @click="autoCreate">自动创建晨检任务</el-button>
          <el-button @click="syncExpected">自动同步应检人数</el-button>
          <el-button @click="autoCollect">数据自动采集</el-button>
          <el-button @click="openManualChannel">手动补录通道</el-button>
        </div>
      </div>
    </template>

    <el-table :data="tasksToday"  border>
      <el-table-column prop="date" label="日期" width="140" />
      <el-table-column prop="canteen" label="食堂名称" width="180" />
      <el-table-column label="应检/实检/异常" width="200">
        <template #default="{ row }">{{ row.expected }}/{{ row.actual }}/{{ row.abnormal }}</template>
      </el-table-column>
      <el-table-column label="完成率/状态" width="220">
        <template #default="{ row }">
          <span style="margin-right:8px">{{ rate(row) }}%</span>
          <el-tag :type="statusType(row)" effect="plain">{{ statusLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="280">
        <template #default="{ row }">
          <el-button  @click="view(row)">查看详情</el-button>
          <el-button v-if="statusLabel(row)==='进行中'"  @click="view(row)">手动登记</el-button>
          <el-button  @click="exportRow(row)">导出</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolIdNum } from '../utils/school';
import { useRouter } from 'vue-router';

type Task = { id: string; date: string; canteenId?: string|number; canteen: string; expected: number; actual: number; abnormal: number };

const router = useRouter();
const date = ref<Date | null>(new Date());
const canteens = ref<Array<{ id: number|string; name: string }>>([]);
const canteenId = ref<number|string|undefined>(undefined);
const tasks = ref<Task[]>([]);

function dayStr(d?: Date|null) { const x=d||new Date(); const p=(n:number)=>String(n).padStart(2,'0'); return `${x.getFullYear()}-${p(x.getMonth()+1)}-${p(x.getDate())}`; }
function uid() { return Math.random().toString(36).slice(2,10); }
function persist() { try { localStorage.setItem('morning_tasks', JSON.stringify(tasks.value)); } catch {} }
function restore() { try { const s = localStorage.getItem('morning_tasks'); if (s) tasks.value = JSON.parse(s); } catch {} }

const tasksToday = computed(() => tasks.value.filter(t => t.date === dayStr(date.value)));
function ensureCanteenName(): string { const c = canteens.value.find(c => String(c.id)===String(canteenId.value)); return c?.name || '学校食堂'; }

function autoCreate() {
  const d = dayStr(date.value);
  const exists = tasks.value.some(t => t.date===d && String(t.canteenId||'')===String(canteenId.value||''));
  if (exists) return;
  tasks.value.unshift({ id: uid(), date: d, canteenId: canteenId.value, canteen: ensureCanteenName(), expected: 0, actual: 0, abnormal: 0 });
  persist();
}
function ensureDailyTasks(d: string) {
  if (!canteens.value.length) return;
  // Seed tasks for each canteen with zeros if missing
  for (const c of canteens.value) {
    const exists = tasks.value.some(t => t.date===d && String(t.canteenId||'')===String(c.id));
    if (!exists) {
      tasks.value.push({ id: uid(), date: d, canteenId: c.id, canteen: c.name, expected: 0, actual: 0, abnormal: 0 });
    }
  }
  // Keep newest first
  tasks.value.sort((a,b)=> (a.date<b.date?1:a.date>b.date?-1:0));
  persist();
}
function syncExpected() {
  const target = tasksToday.value.find(t => String(t.canteenId||'')===String(canteenId.value||'')) || tasksToday.value[0];
  if (!target) return;
  target.expected = Math.max(target.expected, 10 + Math.floor(Math.random()*20));
  persist();
}
function autoCollect() {
  const t = tasksToday.value.find(t => String(t.canteenId||'')===String(canteenId.value||'')) || tasksToday.value[0];
  if (!t) return;
  if (t.expected===0) t.expected = 20;
  const remain = Math.max(0, t.expected - t.actual);
  const add = Math.min(remain, 1 + Math.floor(Math.random()*5));
  t.actual += add;
  if (Math.random()<0.2) t.abnormal = Math.min(t.actual, t.abnormal + 1);
  persist();
}

function rate(t: Task) { if (!t.expected) return 0; return Math.min(100, Math.round((t.actual / t.expected) * 100)); }
function statusLabel(t: Task) {
  const r = rate(t);
  const unhandled = (t as any).unhandledAbnormal ?? t.abnormal;
  if (r===0) return '未开始';
  if (r>0 && r<100) return '进行中';
  if (r===100 && unhandled>0) return '有异常';
  return '已完成';
}
function statusType(t: Task) { const s = statusLabel(t); return s==='未开始' ? 'info' : s==='进行中' ? 'primary' : s==='有异常' ? 'warning' : 'success'; }

function view(t: Task) { router.push({ path: '/morning-check/detail', query: { date: t.date, canteen: t.canteen } }); }
function exportRow(t: Task) { exportCsv(`晨检-${t.date}-${t.canteen}`, [{ date: t.date, canteen: t.canteen, expected: t.expected, actual: t.actual, abnormal: t.abnormal, rate: rate(t), status: statusLabel(t) }], { date:'日期', canteen:'食堂', expected:'应检', actual:'实检', abnormal:'异常', rate:'完成率', status:'状态' }); }

function openManualChannel() {
  // 优先进入“进行中”的任务，否则创建今日任务后进入
  let t = tasksToday.value.find(x => statusLabel(x) === '进行中');
  if (!t) {
    autoCreate();
    t = tasksToday.value[0];
  }
  if (t) view(t);
}

onMounted(async () => {
  restore();
  try {
    const list = await api.canteensList(getCurrentSchoolIdNum());
    canteens.value = Array.isArray(list) ? list : (list?.items || []);
    canteenId.value = canteens.value[0]?.id;
    ensureDailyTasks(dayStr(date.value));
  } catch {}
});

watch([date, canteens], () => {
  try { ensureDailyTasks(dayStr(date.value)); } catch {}
});
</script>

<style scoped>
.header { display:flex; align-items:center; justify-content:space-between; }
.actions > * { margin-left: 8px; }
</style>
