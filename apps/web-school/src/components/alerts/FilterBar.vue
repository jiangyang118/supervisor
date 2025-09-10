<template>
  <div class="filter-bar">
    <el-form :inline="true" @submit.prevent>
      <el-form-item label="食堂">
        <el-select v-model="schoolId" clearable filterable placeholder="请选择">
          <el-option v-for="s in schools" :key="String(s.id)" :label="s.name" :value="String(s.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="预警类型">
        <el-select v-model="types" multiple clearable placeholder="全部" style="min-width:160px" collapse-tags
      collapse-tags-tooltip
      :max-collapse-tags="3">
          <el-option v-for="t in TYPE_ENUM" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="statusLabel" clearable placeholder="全部" style="width:160px">
          <el-option v-for="s in STATUS_ENUM" :key="String(s.label)" :label="s.label" :value="s.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="value2"
          type="daterange"
          unlink-panels
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :shortcuts="shortcuts"
          :size="size"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="refresh">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useWarningStore, TYPE_ENUM, STATUS_ENUM } from '../../stores/warning';
import { api } from '../../services/api';

const store = useWarningStore();
const schools = ref<Array<{ id: number | string; name: string }>>([]);

const loading = computed(() => store.loading);
const schoolId = computed({ get: () => store.schoolId, set: (v) => (store.schoolId = v || undefined) });
const types = computed({ get: () => store.types, set: (v: string[]) => (store.types = v || []) });
const statusLabel = computed({ get: () => store.statusLabel, set: (v) => (store.statusLabel = (v as any) || '全部') });
const value2 = computed<[string, string] | null>({
  get: () => store.customRange,
  set: (v) => { store.customRange = (v as any) || null; store.datePreset = 'custom'; },
});
const size = ref<'default' | 'small' | 'large'>('default');
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date();
      end.setHours(23,59,59,999);
      return [start, end];
    },
  },
  {
    text: '近7天',
    value: () => {
      const end = new Date();
      end.setHours(23,59,59,999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0,0,0,0);
      return [start, end];
    },
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date();
      end.setHours(23,59,59,999);
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0,0,0,0);
      return [start, end];
    },
  },
];

function refresh() { store.fetchList(); }
function reset() {
  store.types = [];
  store.statusLabel = '全部';
  store.datePreset = 'custom';
  store.customRange = null; // 清空后默认不带时间，或可设为今天
  store.fetchList();
}

onMounted(() => {
  api.regSchools().then((list) => (schools.value = list || [])).catch(() => (schools.value = []));
});
</script>

<style scoped>
.filter-bar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
</style>
