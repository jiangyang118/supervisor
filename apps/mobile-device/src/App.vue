<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { refreshEmployees, listEmployees } from './api';

const base = ref<string>('');
const equipmentCode = ref<string>('DEMO-EC-0001');
const loading = ref(false);
const employees = ref<Array<{ userId: string; name: string; healthStartTime?: string; healthEndTime?: string }>>([]);
const message = ref<string>('');

onMounted(() => {
  const lsBase = localStorage.getItem('SCHOOL_INTEGRATION_BASE') || '';
  base.value = lsBase || (window as any)?.SCHOOL_INTEGRATION_BASE || 'http://localhost:4001';
});

async function doRefresh() {
  loading.value = true;
  message.value = '';
  try {
    localStorage.setItem('SCHOOL_INTEGRATION_BASE', base.value);
    const r = await refreshEmployees(equipmentCode.value);
    message.value = r.success ? `刷新成功，缓存人数：${r.count ?? 0}` : `失败：${r.message || ''}`;
  } catch (e: any) {
    message.value = `请求失败：${e?.message || e}`;
  } finally {
    loading.value = false;
  }
}

async function fetchList() {
  loading.value = true;
  message.value = '';
  try {
    localStorage.setItem('SCHOOL_INTEGRATION_BASE', base.value);
    employees.value = await listEmployees();
    message.value = `已获取 ${employees.value.length} 人`;
  } catch (e: any) {
    message.value = `请求失败：${e?.message || e}`;
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <div class="container">
    <h2>设备管理平台（演示）</h2>
    <div class="form">
      <label>学校端地址：</label>
      <input v-model="base" placeholder="http://<宿主机IP>:4001" />
    </div>
    <div class="form">
      <label>equipmentCode：</label>
      <input v-model="equipmentCode" />
    </div>
    <div class="actions">
      <button :disabled="loading" @click="doRefresh">刷新员工缓存</button>
      <button :disabled="loading" @click="fetchList">拉取员工列表</button>
    </div>
    <p class="msg">{{ message }}</p>
    <ul class="emp" v-if="employees.length">
      <li v-for="e in employees" :key="e.userId">
        {{ e.userId }} · {{ e.name }}
        <span v-if="e.healthStartTime || e.healthEndTime" class="dim">
          （{{ e.healthStartTime || '-' }} ~ {{ e.healthEndTime || '-' }}）
        </span>
      </li>
    </ul>
  </div>
</template>

<style>
.container { padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
.form { margin: 8px 0; }
label { display: inline-block; width: 120px; }
input { width: 280px; padding: 6px 8px; }
.actions { margin: 12px 0; display: flex; gap: 8px; }
button { padding: 6px 10px; }
.msg { color: #606266; }
.emp { margin-top: 8px; }
.dim { color: #909399; margin-left: 4px; }
</style>
