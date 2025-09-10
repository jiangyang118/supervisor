<template>
  <!-- Standalone layout for auth pages (e.g., /login) -->
  <div v-if="isAuthPage" class="auth-only">
    <router-view />
  </div>

  <!-- Default application shell -->
  <el-container v-else style="height: 100vh">
    <el-header class="app-header" style="display: flex; align-items: center; justify-content: space-between">
      <div>学校端 • 食品安全云<span v-if="schoolName"> ｜ {{ schoolName }}</span></div>
      <div style="display:flex; align-items:center; gap:12px">
        <el-button v-if="has('overview.*')" link type="primary" @click="go('/overview')">首页</el-button>
        <el-button v-if="has('overview.*')" link @click="go('/reports')">每日报表</el-button>
        <el-divider direction="vertical" />
        <el-dropdown>
          <span class="el-dropdown-link" style="cursor:pointer">
            {{ displayName }}<i class="el-icon-arrow-down el-icon--right" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="onLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="240px" class="app-aside">
        <el-menu :key="openeds.join(',')" :default-active="active" :default-openeds="openeds" router unique-opened>
          <el-menu-item v-if="has('overview.*')" index="/overview">首页</el-menu-item>
          <!-- 预警概览升为一级模块，置于首页下方展示 -->
          <el-menu-item v-if="has('overview.*')" index="/overview/alerts">预警概览</el-menu-item>
          <el-sub-menu v-if="has('overview.*')" index="overview">
            <template #title>总览</template>
            <el-menu-item index="/analytics">数据看板</el-menu-item>
          </el-sub-menu>

          <el-sub-menu v-if="has('bright.*')" index="bright">
            <template #title>明厨亮灶管理</template>
            <el-menu-item index="/bright-kitchen/live">实时视频</el-menu-item>
            <el-menu-item index="/bright-kitchen/playback">视频回放</el-menu-item>
            <el-menu-item index="/bright-kitchen/snapshots">快照留存</el-menu-item>
            <el-menu-item index="/bright-kitchen/channels">摄像头/NVR管理</el-menu-item>
            <el-divider />
            <el-menu-item index="/ai/events">AI 违规抓拍明细</el-menu-item>
            <el-menu-item index="/ai/summary">AI 行为统计与导出</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="has('daily.*')" index="daily">
            <template #title>日常运营管理</template>
            <el-menu-item index="/morning-check">晨检管理</el-menu-item>
            <el-menu-item index="/sampling/records">留样管理</el-menu-item>
            <el-menu-item index="/pesticide-tests">农残快检管理</el-menu-item>
            <el-menu-item index="/disinfection">消毒管理</el-menu-item>
            <el-menu-item index="/waste">废弃物管理</el-menu-item>
            <el-menu-item index="/hygiene/inspections">卫生管理</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="has('inventory.*')" index="inventory">
            <template #title>出入库管理</template>
            <el-menu-item index="/inventory/items">商品管理</el-menu-item>
            <el-menu-item index="/inventory/inbound">入库登记</el-menu-item>
            <el-menu-item index="/inventory/outbound">出库登记</el-menu-item>
            <el-menu-item index="/inventory/stock">库存与盘点</el-menu-item>
            <el-menu-item index="/inventory/tickets">索票索证管理</el-menu-item>
            <el-menu-item index="/suppliers">供应商管理</el-menu-item>
            <el-menu-item index="/warehouses">仓库信息管理</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="has('hr.*')" index="hr">
            <template #title>人事管理</template>
            <el-menu-item index="/certificates">人员健康证</el-menu-item>
            <el-menu-item index="/hr/staff">人员资质</el-menu-item>
            <el-menu-item index="/hr/canteen-licenses">食堂资质</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="has('env.*')" index="env-dev">
            <template #title>环境及设备管理</template>
            <el-menu-item index="/risks">隐患排查管理</el-menu-item>
            <el-menu-item index="/hygiene/assets">固定资产维护记录</el-menu-item>
            <el-menu-item index="/environment/status">环境状态</el-menu-item>
            <el-menu-item index="/devices">智能终端设备管理</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="has('public.*')" index="pub-feed">
            <template #title>公示与反馈</template>
            <el-menu-item index="/public-feedback">公众反馈处理</el-menu-item>
            <el-menu-item index="/public-config">公示内容配置</el-menu-item>
            <el-menu-item index="/system/news">食安资讯发布</el-menu-item>
            <el-menu-item index="/system/announcements">公告公文管理</el-menu-item>
            <el-menu-item index="/food-waste">食品浪费分析</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu v-if="has('system.*') || has('users.manage')" index="system">
            <template #title>系统配置</template>
            <el-menu-item index="/system/canteen">食堂信息维护+食堂资质</el-menu-item>
            <el-menu-item index="/system/linkage">关联监管端审核</el-menu-item>
            <el-menu-item index="/system/app-download">移动端扫码</el-menu-item>
            <el-menu-item index="/system/trustivs-test">TrustIVS 测试</el-menu-item>
            <el-menu-item v-if="has('users.manage')" index="/system/users">用户管理</el-menu-item>
            <el-menu-item v-if="has('users.manage')" index="/system/roles">角色管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-main>
        <div v-if="showIntegrationBanner && !integration.base" class="integration-banner">
          <el-alert
            title="未检测到学校端集成服务地址（SCHOOL_INTEGRATION_BASE）"
            type="warning"
            :closable="false"
            description="请在 public/integration.config.json 配置，或在浏览器控制台/本页右侧设置中指定。"
            show-icon
          />
        </div>
        <div v-else-if="showIntegrationBanner" class="integration-banner">
          <el-alert :closable="false" type="success" show-icon>
            <template #title>
              设备集成：{{ integration.base }}
            </template>
            <template #default>
              候选域名：{{ integration.candidates || '未配置' }}
              <el-button size="small" type="primary" text @click="testHealth">测试连接</el-button>
              <el-button size="small" text @click="openConfig">设置</el-button>
              <span v-if="healthOk === true" style="color:#67c23a">已连接</span>
              <span v-else-if="healthOk === false" style="color:#f56c6c">连接失败</span>
            </template>
          </el-alert>
        </div>
        <PageHeader />
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import PageHeader from './components/PageHeader.vue';
import { useAuthStore } from './stores/auth';
import { api } from './services/api';
import { getCurrentSchoolId } from './utils/school';
const route = useRoute();
const router = useRouter();
const isAuthPage = computed(() => route.path === '/login');
const active = computed(() => route.path);
const openeds = computed(() => {
  const p = route.path;
  // 合并：AI 路由归入「明厨亮灶」分组展开
  if (p.startsWith('/ai/') || p.startsWith('/bright-kitchen/')) return ['bright'];
  if (p.startsWith('/analytics')) return ['overview'];
  if (
    p.startsWith('/morning-check') ||
    p.startsWith('/sampling/') ||
    p.startsWith('/pesticide-tests') ||
    p.startsWith('/disinfection') ||
    p.startsWith('/waste') ||
    p.startsWith('/hygiene/')
  )
    return ['daily'];
  if (
    p.startsWith('/inventory/') ||
    p === '/suppliers' ||
    p === '/warehouses'
  )
    return ['inventory'];
  if (p.startsWith('/certificates') || p.startsWith('/hr/')) return ['hr'];
  if (
    p.startsWith('/public-') ||
    p.startsWith('/system/news') ||
    p.startsWith('/system/announcements') ||
    p === '/food-waste'
  )
    return ['pub-feed'];
  if (p.startsWith('/environment/') || p === '/devices' || p.startsWith('/risks')) return ['env-dev'];
  if (p.startsWith('/system/')) return ['system'];
  return [] as string[];
});
const go = (p: string) => router.push(p);
const auth = useAuthStore();
const has = (p: string) => auth.hasPerm(p);

// School name in header
const schoolName = ref<string>('');
async function loadSchoolName() {
  try {
    const sid = getCurrentSchoolId();
    const list = await api.regSchools();
    const it = (list || []).find((s: any) => String(s.id) === String(sid));
    schoolName.value = it?.name || '';
  } catch { schoolName.value = ''; }
}
onMounted(() => {
  loadSchoolName();
  const handler = () => loadSchoolName();
  window.addEventListener('school-changed', handler as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', handler as any));
});

const integration = computed(() => ({
  base: (window as any).SCHOOL_INTEGRATION_BASE as string | undefined,
  candidates: (window as any).MEGO_CANDIDATES as string | undefined,
}));

const showIntegrationBanner = computed(() => route.path.startsWith('/morning-check'));

const healthOk = ref<boolean | null>(null);
async function testHealth() {
  healthOk.value = null;
  const base = integration.value.base;
  if (!base) return;
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/health`);
    healthOk.value = r.ok;
  } catch {
    healthOk.value = false;
  }
}

function openConfig() {
  const b = prompt('学校端集成服务地址 (SCHOOL_INTEGRATION_BASE):', integration.value.base || '');
  if (b !== null) {
    localStorage.setItem('SCHOOL_INTEGRATION_BASE', b);
    (window as any).SCHOOL_INTEGRATION_BASE = b;
  }
  const c = prompt('候选上游域名池 (MEGO_CANDIDATES):', integration.value.candidates || '');
  if (c !== null) {
    localStorage.setItem('MEGO_CANDIDATES', c);
    (window as any).MEGO_CANDIDATES = c;
  }
}

const displayName = computed(() => auth.user?.name || '未登录');
async function onLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning', confirmButtonText: '退出', cancelButtonText: '取消' });
  } catch { return; }
  await auth.logout();
  ElMessage.success('已退出登录');
  router.replace('/login');
}
</script>

<style>
body {
  margin: 0;
}
.auth-only { min-height: 100vh; }
.integration-banner { margin-bottom: 8px; }
</style>
