<template>
  <el-card class="al-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>预警汇总</span>
      </div>
    </template>
    <el-form :inline="true" class="al-filters">
      <el-form-item label="学校"
        ><el-select v-model="filters.schoolId" clearable placeholder="全部" style="min-width: 220px"
          ><el-option v-for="s in schools" :key="s.id" :value="s.id" :label="s.name" /></el-select
      ></el-form-item>
      <el-form-item label="类型"
        ><el-select v-model="filters.type" clearable placeholder="全部" style="min-width: 180px"
          ><el-option v-for="t in types" :key="t" :value="t" :label="t" /></el-select
      ></el-form-item>
      <el-form-item label="日期"
        ><el-date-picker v-model="range" type="daterange" unlink-panels
      /></el-form-item>
      <el-form-item>
        <el-button @click="reload">查询</el-button>
        <el-button @click="exportCsv">导出</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card class="al-box"
          ><template #header>预警看板</template>
          <div class="al-stats">
            <div v-for="s in stats" :key="s.type" class="al-stat">
              <div class="al-stat-type">{{ s.type }}</div>
              <div class="al-stat-count">{{ s.count }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="al-box"
          ><template #header>接收配置</template>
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px">
            <el-switch v-model="cfg.channels.sms" active-text="短信" />
            <el-switch v-model="cfg.channels.app" active-text="站内" />
            <el-button size="small" @click="saveCfg">保存</el-button>
          </div>
          <div>
            <div v-for="(r, idx) in cfg.rules" :key="idx" style="margin-bottom: 6px">
              <el-tag effect="plain" style="margin-right: 8px">{{ r.code }}</el-tag>
              <el-input v-model="r.name" size="small" style="width: 160px; margin-right: 8px" />
              <el-input v-model="r.window.start" size="small" style="width: 90px" /> -
              <el-input
                v-model="r.window.end"
                size="small"
                style="width: 90px; margin-right: 8px"
              />
              <el-input
                v-model="recipientsText[idx]"
                size="small"
                placeholder="接收人(逗号分隔)"
                style="width: 220px; margin-right: 8px"
              />
            </div>
            <el-button size="small" @click="addRule">新增规则</el-button>
            <el-divider>测试推送</el-divider>
            <div style="display: flex; gap: 8px">
              <el-input v-model="testMsg" placeholder="消息内容" /><el-button
                size="small"
                @click="sendTest"
                >发送</el-button
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card style="margin-top: 12px" class="al-details"
      ><template #header>预警明细</template>
      <el-table :data="rows" size="small" border height="calc(100vh - 420px)">
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="school" label="学校" width="160" />
        <el-table-column prop="kind" label="类型" width="140" />
        <el-table-column prop="detail" label="详情" />
        <el-table-column prop="at" label="时间" width="200" />
      </el-table>
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const schools = ref<Array<{ id: string; name: string }>>([]);
const types = [
  '证件过期',
  '食材过期',
  '行为预警',
  '设备离线',
  '设备预警',
  '农残预警',
  '上报预警',
  '投诉预警',
];
const filters = ref<{ schoolId?: string; type?: string }>({});
const range = ref<[Date, Date] | null>(null);
const stats = ref<Array<{ type: string; count: number }>>([]);
const rows = ref<any[]>([]);
const cfg = ref<any>({ enabled: true, channels: { sms: true, app: true }, rules: [] });
const recipientsText = ref<string[]>([]);
const testMsg = ref('发现异常请尽快处理');

function withRange(p: any) {
  const q: any = { ...p };
  if (range.value) {
    if (range.value[0]) q.start = new Date(range.value[0]).toISOString();
    if (range.value[1]) q.end = new Date(range.value[1]).toISOString();
  }
  return q;
}
async function loadSummary() {
  const s = await api.alertsSummary(withRange({}));
  stats.value = s.stats || [];
}
async function loadEvents() {
  const res = await api.alertsEvents(
    withRange({ type: filters.value.type, schoolId: filters.value.schoolId }),
  );
  rows.value = res.items || [];
}
async function reload() {
  await Promise.all([loadSummary(), loadEvents()]);
}
async function exportCsv() {
  const csv = await api.alertsExportCsv(
    withRange({ type: filters.value.type, schoolId: filters.value.schoolId }),
  );
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '预警明细.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function loadCfg() {
  cfg.value = await api.alertsConfigGet();
  recipientsText.value = (cfg.value.rules || []).map((r: any) => (r.recipients || []).join(','));
}
async function saveCfg() {
  cfg.value.rules = (cfg.value.rules || []).map((r: any, i: number) => ({
    ...r,
    recipients: (recipientsText.value[i] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }));
  await api.alertsConfigSave(cfg.value);
}
function addRule() {
  cfg.value.rules.push({
    code: '自定义',
    name: '新规则',
    enabled: true,
    window: { start: '08:00', end: '18:00' },
    recipients: [],
    scope: 'all',
  });
  recipientsText.value.push('');
}
async function sendTest() {
  await api.alertsNotify({ to: ['监管群'], message: testMsg.value, channel: 'app' });
}

onMounted(async () => {
  schools.value = await api.schools();
  await Promise.all([reload(), loadCfg()]);
});
</script>

<style>
.al-card {
  min-height: 520px;
}
.al-filters {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}
.al-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.al-stat {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.al-stat-type {
  color: var(--el-text-color-regular);
}
.al-stat-count {
  font-size: 18px;
  font-weight: 600;
}
.al-box {
  height: 280px;
  display: flex;
  flex-direction: column;
}
.al-box .el-card__body {
  overflow: auto;
  flex: 1 1 auto;
}
.al-details .el-card__body {
  padding: 0;
}
</style>
