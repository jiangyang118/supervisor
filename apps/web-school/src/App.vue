<template>
  <!-- Standalone layout for auth pages (e.g., /login) -->
  <div v-if="isAuthPage" class="auth-only">
    <router-view />
  </div>

  <!-- Default application shell -->
  <el-container v-else class="app-shell">
    <el-header class="app-header">
      <div class="header-left">
        <el-button text class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon><component :is="collapsed ? Expand : Fold" /></el-icon>
        </el-button>
        <div class="app-logo" @click="go('/overview')">
          <el-icon class="logo-icon"><House /></el-icon>
          <span class="logo-text">智慧食安</span>
          <span class="school" v-if="schoolName">｜ {{ schoolName }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-button v-if="has('overview.view')" link type="primary" @click="go('/overview')">
          <el-icon><House /></el-icon>
          首页
        </el-button>
        <el-divider direction="vertical" />
        <el-dropdown>
          <span class="user-entry">
            <el-icon><User /></el-icon>
            <span class="name">{{ displayName }}</span>
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
      <el-aside :width="collapsed ? '64px' : '240px'" class="app-aside">
        <el-menu
          ref="menuRef"
          :key="openeds.join(',') + String(collapsed)"
          :default-active="active"
          :default-openeds="openeds"
          :collapse="collapsed"
          :collapse-transition="false"
          router
          unique-opened
        >
          <el-menu-item v-if="has('overview.*')" index="/overview">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <!-- 预警概览升为一级模块，置于首页下方展示 -->
          <el-menu-item v-if="has('overview.*')" index="/overview/alerts">
            <el-icon><Warning /></el-icon>
            <span>预警概览</span>
          </el-menu-item>

          <el-sub-menu v-if="hasAny(['bright.live','bright.playback','bright.snapshots','bright.ai-events'])" index="bright">
            <template #title>
              <el-icon><VideoCamera /></el-icon>
              <span>互联网+明厨亮灶</span>
            </template>
            <el-menu-item v-if="has('bright.live')" index="/bright-kitchen/live"><el-icon><VideoCamera /></el-icon><span>实时视频</span></el-menu-item>
            <el-menu-item v-if="has('bright.ai-events')" index="/ai/events"><el-icon><Camera /></el-icon><span>AI 违规抓拍明细</span></el-menu-item>
            <el-menu-item v-if="has('bright.playback')" index="/bright-kitchen/playback"><el-icon><VideoPlay /></el-icon><span>视频回放</span></el-menu-item>
            <el-menu-item v-if="has('bright.snapshots')" index="/bright-kitchen/snapshots"><el-icon><Picture /></el-icon><span>快照留存</span></el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="hasAny(['daily.morning','daily.sampling','daily.disinfection','daily.environment','daily.pesticide','daily.waste','daily.device-safety'])" index="daily">
            <template #title>
              <el-icon><List /></el-icon>
              <span>日常运营管理</span>
            </template>
            <el-menu-item v-if="has('daily.morning')" index="/daily-op/morning-check"><el-icon><Sunny /></el-icon><span>晨检管理</span></el-menu-item>
            <el-menu-item v-if="has('daily.sampling')" index="/daily-op/sampling"><el-icon><TakeawayBox /></el-icon><span>留样管理</span></el-menu-item>
            <el-menu-item v-if="has('daily.disinfection')" index="/daily-op/disinfection"><el-icon><Brush /></el-icon><span>消毒管理</span></el-menu-item>
            <el-menu-item v-if="has('daily.environment')" index="/daily-op/environment"><el-icon><Histogram /></el-icon><span>环境监测管理</span></el-menu-item>
            <el-menu-item v-if="has('daily.pesticide')" index="/daily-op/pesticide-tests"><el-icon><DataAnalysis /></el-icon><span>农残快检管理</span></el-menu-item>
            <el-menu-item v-if="has('daily.waste')" index="/daily-op/waste"><el-icon><Delete /></el-icon><span>废弃物管理</span></el-menu-item>
            <el-menu-item v-if="has('daily.device-safety')" index="/daily-op/device-safety"><el-icon><Monitor /></el-icon><span>设备安全管理</span></el-menu-item>
          
          </el-sub-menu>
          <el-sub-menu v-if="hasAny(['inventory.items','inventory.inbound','inventory.outbound','inventory.stock','inventory.additives'])" index="inventory">
            <template #title>
              <el-icon><Box /></el-icon>
              <span>出入库管理</span>
            </template>
            <el-menu-item v-if="has('inventory.items')" index="/inventory/items"><el-icon><Goods /></el-icon><span>商品管理</span></el-menu-item>
            <el-menu-item v-if="has('inventory.inbound')" index="/inventory/inbound"><el-icon><Download /></el-icon><span>入库登记</span></el-menu-item>
            <el-menu-item v-if="has('inventory.outbound')" index="/inventory/outbound"><el-icon><Upload /></el-icon><span>出库登记</span></el-menu-item>
            <el-menu-item v-if="has('inventory.stock')" index="/inventory/stock"><el-icon><Tickets /></el-icon><span>库存记录</span></el-menu-item>
            <!-- <el-menu-item v-if="has('inventory.additives')" index="/inventory/additives">食品添加剂</el-menu-item> -->
            
            <!-- 仓库信息管理已下线 -->
          </el-sub-menu>
          <el-sub-menu v-if="hasAny(['hr.staff','hr.canteen-licenses','hr.suppliers'])" index="hr">
            <template #title>
              <el-icon><Collection /></el-icon>
              <span>资质证件管理</span>
            </template>
            <el-menu-item v-if="has('hr.staff')" index="/hr/staff"><el-icon><User /></el-icon><span>人员资质</span></el-menu-item>
            <el-menu-item v-if="has('hr.canteen-licenses')" index="/hr/canteen-licenses"><el-icon><OfficeBuilding /></el-icon><span>食堂资质</span></el-menu-item>
            <el-menu-item v-if="has('hr.suppliers')" index="/hr/suppliers"><el-icon><Shop /></el-icon><span>供应商资质</span></el-menu-item>
          </el-sub-menu>
          
          <!-- 公示与反馈模块已下线：相关入口已移除 -->
          
          <el-sub-menu v-if="hasAny(['system.canteen','users.manage','system.app','system.devices','system.trustivs'])" index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统配置</span>
            </template>
            <el-menu-item v-if="has('system.canteen')" index="/system/canteen"><el-icon><OfficeBuilding /></el-icon><span>食堂信息维护</span></el-menu-item>
            <el-menu-item v-if="has('users.manage')" index="/system/users"><el-icon><UserFilled /></el-icon><span>用户管理</span></el-menu-item>
            <el-menu-item v-if="has('users.manage')" index="/system/roles"><el-icon><Avatar /></el-icon><span>角色管理</span></el-menu-item>
            <!-- <el-menu-item index="/system/linkage">关联监管端审核</el-menu-item> -->
            <!-- <el-menu-item index="/public-config">公示内容配置</el-menu-item> -->
            <!-- <el-menu-item index="/system/announcements">公告公文管理</el-menu-item> -->
            <el-menu-item v-if="has('system.app')" index="/system/app-download"><el-icon><Cellphone /></el-icon><span>移动端扫码</span></el-menu-item>
            <el-menu-item v-if="has('system.devices')" index="/devices"><el-icon><Monitor /></el-icon><span>智能终端设备管理</span></el-menu-item>
            <el-menu-item v-if="has('system.trustivs')" index="/system/trustivs-test"><el-icon><Link /></el-icon><span>TrustIVS 测试</span></el-menu-item>
          
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
              <el-button  type="primary" text @click="testHealth">测试连接</el-button>
              <el-button  text @click="openConfig">设置</el-button>
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
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import PageHeader from './components/PageHeader.vue';
import { useAuthStore } from './stores/auth';
import { api } from './services/api';
import { getCurrentSchoolId } from './utils/school';
import { House, Warning, VideoCamera, List, Box, Collection, Setting, Sunny, TakeawayBox, Brush, Histogram, DataAnalysis, Delete, Monitor, Camera, VideoPlay, Picture, Goods, Download, Upload, Tickets, User, OfficeBuilding, Shop, UserFilled, Avatar, Cellphone, Link, Fold, Expand } from '@element-plus/icons-vue';
const route = useRoute();
const router = useRouter();
const isAuthPage = computed(() => route.path === '/login');
const collapsed = ref(false);
// Map secondary/detail routes to their primary menu item for highlighting
function mapPrimaryMenu(path: string): string {
  const primary: Record<string, string> = {
    // HR module
    '/suppliers': '/suppliers',
    '/hr/staff': '/hr/staff',
    '/hr/canteen-licenses': '/hr/canteen-licenses',
    // Daily ops
    '/daily-op/morning-check': '/daily-op/morning-check',
    '/daily-op/sampling': '/daily-op/sampling',
    '/daily-op/pesticide-tests': '/daily-op/pesticide-tests',
    '/daily-op/disinfection': '/daily-op/disinfection',
    '/daily-op/waste': '/daily-op/waste',
    // Inventory
    '/inventory/items': '/inventory/items',
    '/inventory/inbound': '/inventory/inbound',
    '/inventory/outbound': '/inventory/outbound',
    '/inventory/stock': '/inventory/stock',
    
    '/inventory/additives': '/inventory/additives',
    // Public module removed
    '/public-config': '/public-config',
    // System
    '/system/canteen': '/system/canteen',
    '/system/news': '/system/news',
    '/system/announcements': '/system/announcements',
    '/system/users': '/system/users',
    '/system/roles': '/system/roles',
  };
  // pick the longest prefix that matches the current path
  const keys = Object.keys(primary).sort((a, b) => b.length - a.length);
  const hit = keys.find((k) => path.startsWith(k));
  return hit ? primary[hit] : path;
}

const active = computed(() => mapPrimaryMenu(route.path));
const openeds = computed(() => {
  const p = route.path;
  // 合并：AI 路由归入「明厨亮灶」分组展开
  if (p.startsWith('/ai/') || p.startsWith('/bright-kitchen/')) return ['bright'];
  if (p.startsWith('/analytics')) return ['overview'];
  if (
    p.startsWith('/daily-op/morning-check') ||
    p.startsWith('/daily-op/sampling') ||
    p.startsWith('/daily-op/pesticide-tests') ||
    p.startsWith('/daily-op/disinfection') ||
    p.startsWith('/daily-op/waste') ||
    p.startsWith('/daily-op/environment')
  )
    return ['daily'];
  if (
    p.startsWith('/inventory/')
  )
    return ['inventory'];
  if (p.startsWith('/certificates') || p.startsWith('/hr/') || p.startsWith('/suppliers')) return ['hr'];
  if (p === '/public-config') return ['system'];
  
  if (p === '/devices' || p.startsWith('/system/')) return ['system'];
  return [] as string[];
});
const go = (p: string) => router.push(p);
const auth = useAuthStore();
const has = (p: string) => auth.hasPerm(p);
const hasAny = (arr: string[]) => arr.some((k) => has(k));

// Menu ref (kept for future programmatic control if needed)
const menuRef = ref<any>(null);

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

/* Shell layout */
.app-shell { height: 100vh; }
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}
.header-left { display: flex; align-items: center; gap: 8px; }
.collapse-btn { padding: 4px; }
.collapse-btn .el-icon { color: #606266; }
.app-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }
.app-logo .logo-icon { color: var(--el-color-primary); }
.app-logo .logo-text { letter-spacing: .3px; }
.app-logo .school { color: #909399; font-weight: 500; }
.header-right { display: flex; align-items: center; gap: 8px; }
.header-right .user-entry { display:flex; align-items:center; gap:6px; cursor:pointer; color:#303133 }

.app-aside { border-right: 1px solid var(--el-border-color); background: #fff; }
.app-aside :deep(.el-menu) {
  border-right: none;
  --el-menu-item-height: 42px;
}
.app-aside :deep(.el-menu .el-menu-item),
.app-aside :deep(.el-sub-menu__title) {
  padding-left: 12px !important;
}
.app-aside :deep(.el-menu .el-menu-item .el-icon),
.app-aside :deep(.el-sub-menu__title .el-icon) { margin-right: 8px; }
.app-aside :deep(.el-menu-item.is-active) {
  background: rgba(64,158,255,0.08);
  position: relative;
}
.app-aside :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--el-color-primary);
}
</style>
