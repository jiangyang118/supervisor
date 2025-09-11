<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
        <span>已接入设备信息</span>
        <el-input
          v-model="q"
          placeholder="搜索设备ID/名称/SN/IP"
          clearable
          style="width: 260px"
          @keyup.enter="load"
        />
        <el-select v-model="type" placeholder="类型" clearable style="width: 160px">
          <el-option v-for="t in types" :key="t" :label="typeLabel(t)" :value="t" />
        </el-select>
        <el-select v-model="status" placeholder="状态" clearable style="width: 160px">
          <el-option v-for="s in statuses" :key="s" :label="statusLabel(s)" :value="s" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
        <el-divider direction="vertical" />
        <el-button type="success" @click="drawerVisible = true">新增设备（米果晨检仪）</el-button>
      </div>
    </template>
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="设备ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">{{ typeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'ONLINE' ? 'success' : row.status === 'FAULT' ? 'danger' : 'info'"
          >
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="位置" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="sn" label="序列号" width="160" />
      <el-table-column prop="model" label="型号" width="120" />
      <el-table-column prop="firmware" label="固件" width="120" />
      <el-table-column prop="lastSeen" label="最近在线" width="180" />
    </el-table>
  </el-card>

  <!-- 新增设备抽屉：米果晨检仪自动搜索接入 -->
  <el-drawer v-model="drawerVisible" title="新增设备 · 米果晨检仪" size="40%">
    <el-form label-width="120px" :model="discoverForm">
      <el-form-item label="equipmentCode" required>
        <el-input v-model="discoverForm.equipmentCode" placeholder="请输入设备编码/扫码" />
      </el-form-item>
      <el-form-item label="候选上游域名池" required>
        <el-input
          type="textarea"
          :rows="3"
          v-model="discoverForm.candidatesText"
          placeholder="一行一个，如：http://localhost:4003"
        />
        <div style="color: #999; font-size: 12px; margin-top: 4px">从平台参数注入，支持手动调整</div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="discovering" @click="onDiscover">自动搜索</el-button>
      </el-form-item>
      <template v-if="discoverResult">
        <el-result
          v-if="discoverResult.autoSelected"
          icon="success"
          title="米果智能晨检仪（已兼容）"
          sub-title="已接入 上游：{{ discoverResult.autoSelected }}"
        >
          <template #extra>
            <el-space>
              <el-button type="success" @click="onSaveDevice">保存并接入</el-button>
              <el-button @click="refreshEmployees" :loading="empLoading">刷新员工缓存</el-button>
            </el-space>
          </template>
        </el-result>
        <el-result v-else icon="warning" title="未发现可达设备" sub-title="请检查 candidates 与设备编码" />
        <el-alert
          :closable="false"
          type="info"
          style="margin-top: 8px"
          title="探测结果"
          :description="JSON.stringify(discoverResult.results)"
        />
      </template>
      <template v-if="employees.length">
        <el-divider />
        <div style="font-weight: 600; margin-bottom: 6px">员工缓存（前 10 条）</div>
        <el-table :data="employees.slice(0,10)"  border>
          <el-table-column prop="userId" label="工号" width="120" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="healthStartTime" label="健康证开始" width="140" />
          <el-table-column prop="healthEndTime" label="健康证到期" width="140" />
        </el-table>
      </template>
    </el-form>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../services/api';
import { ElMessage } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';

type Device = {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  ip?: string;
  sn?: string;
  model?: string;
  firmware?: string;
  lastSeen: string;
};
const rows = ref<Device[]>([]);
const types = ref<string[]>([]);
const statuses = ref<string[]>([]);
const type = ref<string>();
const status = ref<string>();
const q = ref<string>('');
const loading = ref(false);

const typeLabel = (t?: string) =>
  (
    ({ GATEWAY: '网关', CAMERA: '摄像头', SCALE: '留样秤', SENSOR: '传感器', SMOKE: '烟感' }) as any
  )[t || ''] ||
  t ||
  '';
const statusLabel = (s?: string) =>
  (({ ONLINE: '在线', OFFLINE: '离线', FAULT: '故障' }) as any)[s || ''] || s || '';

async function load() {
  loading.value = true;
  try {
    rows.value = await api.devicesList({ schoolId: getCurrentSchoolId(), type: type.value, status: status.value, q: q.value });
  } finally {
    loading.value = false;
  }
}

async function init() {
  types.value = await api.deviceTypes();
  statuses.value = await api.deviceStatuses();
  await load();
}

onMounted(() => {
  init();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
});

// MEGO 新增接入
const drawerVisible = ref(false);
const discovering = ref(false);
const discoverForm = ref({ equipmentCode: '', candidatesText: (location as any).MEGO_CANDIDATES || 'http://localhost:4003' });
const discoverResult = ref<null | { results: Array<{ baseUrl: string; ok: boolean }>; autoSelected: string | null }>(null);
const employees = ref<Array<{ userId: string; name: string; healthStartTime?: string; healthEndTime?: string }>>([]);
const empLoading = ref(false);

async function onDiscover() {
  if (!discoverForm.value.equipmentCode || !discoverForm.value.candidatesText.trim()) {
    ElMessage.warning('请填写设备编码与候选域名');
    return;
  }
  discovering.value = true;
  try {
    const candidates = discoverForm.value.candidatesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const r = await api.megoDiscover({ equipmentCode: discoverForm.value.equipmentCode, candidates });
    discoverResult.value = r;
  } catch (e) {
    ElMessage.error('自动搜索失败');
  } finally {
    discovering.value = false;
  }
}

function onSaveDevice() {
  // 演示：仅提示成功并关闭抽屉，实际可在此调用后端保存设备档案
  ElMessage.success('已接入米果晨检仪');
  drawerVisible.value = false;
  // 可选：刷新设备列表
  load();
}

async function refreshEmployees() {
  if (!discoverForm.value.equipmentCode) return;
  empLoading.value = true;
  try {
    await api.megoEmployeesRefresh(discoverForm.value.equipmentCode);
    const { data } = await api.megoEmployees();
    employees.value = data || [];
    ElMessage.success(`已缓存 ${employees.value.length} 人`);
  } catch (e) {
    ElMessage.error('刷新失败');
  } finally {
    empLoading.value = false;
  }
}
</script>
