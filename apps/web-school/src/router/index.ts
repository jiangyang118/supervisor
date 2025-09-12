import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const Home = () => import('../views/Home.vue');
const Reports = () => import('../views/Reports.vue');

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/logout', meta: { public: true }, beforeEnter: (_to, _from, next) => {
    const auth = useAuthStore();
    auth.logout();
    next({ path: '/login' });
  } },
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'overview', component: Home, meta: { perms: ['overview.view'] } },
  {
    path: '/reports',
    name: 'reports',
    component: Reports,
    meta: { title: '每日报表', actions: ['export-pdf', 'export-csv'], perms: ['overview.*'] },
  },
  

  // AI & Bright Kitchen
  { path: '/ai/events', component: () => import('../views/AiEvents.vue'), meta: { perms: ['bright.ai-events'] } },
  { path: '/ai/summary', component: () => import('../views/AiSummary.vue'), meta: { perms: ['bright.ai-events'] } },
  { path: '/bright-kitchen/live', component: () => import('../views/bright/BrightLive.vue'), meta: { perms: ['bright.live'] } },
  {
    path: '/bright-kitchen/playback',
    component: () => import('../views/bright/BrightPlayback.vue'),
    meta: { perms: ['bright.playback'] },
  },
  {
    path: '/bright-kitchen/snapshots',
    component: () => import('../views/bright/BrightSnapshots.vue'),
    meta: { perms: ['bright.snapshots'] },
  },
  {
    path: '/bright-kitchen/channels',
    component: () => import('../views/bright/BrightChannels.vue'),
    meta: { perms: ['bright.*'] },
  },
  { path: '/system/trustivs-test', component: () => import('../views/TrustivsTest.vue'), meta: { perms: ['system.trustivs'] } },

  // Operational ledgers
  { path: '/daily-op/morning-check', component: () => import('../views/MorningCheck.vue'), meta: { perms: ['daily.morning'] } },
  { path: '/daily-op/morning-check/detail', component: () => import('../views/MorningCheckDetail.vue'), meta: { perms: ['daily.morning'] } },
  { path: '/daily-op/sampling', component: () => import('../views/SamplingRecords.vue'), meta: { perms: ['daily.sampling'] } },
  { path: '/daily-op/dine-with', component: () => import('../views/DineWith.vue'), meta: { perms: ['daily.sampling'] } },
  { path: '/daily-op/pesticide-tests', component: () => import('../views/PesticideTests.vue'), meta: { perms: ['daily.pesticide'] } },
  { path: '/daily-op/disinfection', component: () => import('../views/Disinfection.vue'), meta: { perms: ['daily.disinfection'] } },
  { path: '/daily-op/disinfection/detail', component: () => import('../views/DisinfectionDetail.vue'), meta: { perms: ['daily.disinfection'] } },
  { path: '/daily-op/waste', component: () => import('../views/Waste.vue'), meta: { perms: ['daily.waste'] } },
  { path: '/daily-op/device-safety', component: () => import('../views/DeviceSafety.vue'), meta: { perms: ['daily.device-safety'] } },
  { path: '/daily-op/environment', component: () => import('../views/EnvironmentMonitor.vue'), meta: { perms: ['daily.environment'] } },

  // 卫生管理模块已下线
  { path: '/system/news', component: () => import('../views/SystemNews.vue'), meta: { perms: ['public.*'] } },
  

  // Inventory & suppliers
  { path: '/inventory/items', component: () => import('../views/InventoryItems.vue'), meta: { perms: ['inventory.items'] } },
  { path: '/inventory/inbound', component: () => import('../views/InventoryInbound.vue'), meta: { perms: ['inventory.inbound'] } },
  { path: '/inventory/outbound', component: () => import('../views/InventoryOutbound.vue'), meta: { perms: ['inventory.outbound'] } },
  { path: '/inventory/stock', component: () => import('../views/InventoryStock.vue'), meta: { perms: ['inventory.stock'] } },
  
  { path: '/inventory/additives', component: () => import('../views/InventoryAdditives.vue'), meta: { perms: ['inventory.additives'] } },
  { path: '/hr/suppliers', component: () => import('../views/Suppliers.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/hr/suppliers/new', component: () => import('../views/SupplierEdit.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/hr/suppliers/edit', component: () => import('../views/SupplierEdit.vue'), meta: { perms: ['inventory.*'] } },
  // removed: warehouses management
  // removed: personnel certificates
  // Environment & devices
  

  // Public & waste
  { path: '/public-config', component: () => import('../views/PublicConfig.vue'), meta: { perms: ['system.canteen'] } },


  // Risk & warnings & devices & analytics
  { path: '/warnings', component: () => import('../views/Warnings.vue'), meta: { perms: ['overview.*'] } },
  { path: '/devices', component: () => import('../views/Devices.vue'), meta: { perms: ['system.devices'] } },
  { path: '/analytics', component: () => import('../views/Analytics.vue'), meta: { perms: ['overview.*'] } },
  { path: '/food-index', component: () => import('../views/FoodIndex.vue'), meta: { perms: ['overview.view'] } },
  // Overview combined
  { path: '/overview/alerts', component: () => import('../views/AlertsOverview.vue'), meta: { perms: ['overview.*'] } },
  // Mobile H5 for risk task
  { path: '/risk/task/:id', component: () => import('../views/RiskTaskH5.vue') },

  // System
  { path: '/system/announcements', component: () => import('../views/SystemAnnouncements.vue'), meta: { perms: ['system.canteen'] } },
  { path: '/system/canteen', component: () => import('../views/SystemCanteen.vue'), meta: { perms: ['system.canteen'] } },
  { path: '/system/linkage', component: () => import('../views/SystemLinkage.vue'), meta: { perms: ['system.canteen'] } },
  { path: '/system/app-download', component: () => import('../views/SystemApp.vue'), meta: { perms: ['system.app'] } },
  { path: '/system/users', component: () => import('../views/SystemUsers.vue'), meta: { perms: ['users.manage'] } },
  { path: '/system/roles', component: () => import('../views/SystemRoles.vue'), meta: { perms: ['users.manage'] } },
  { path: '/hr/staff', component: () => import('../views/StaffManagement.vue'), meta: { perms: ['hr.*'] } },
  { path: '/hr/staff/view', component: () => import('../views/PersonnelView.vue'), meta: { perms: ['hr.*'] } },
  { path: '/hr/canteen-licenses', component: () => import('../views/CanteenLicenses.vue'), meta: { perms: ['hr.*'] } },
  { path: '/hr/canteen-licenses/view', component: () => import('../views/CanteenLicenseView.vue'), meta: { perms: ['hr.*'] } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) return next();
  if (!auth.isAuthed) {
    auth.setReturnTo(to.fullPath || '/overview');
    return next({ path: '/login' });
  }
  const required = (to.meta?.perms as string[] | undefined) || [];
  if (required.length && !required.some((p) => auth.hasPerm(p))) {
    // no permission → find first accessible area
    const candidates: Array<{ path: string; perm: string }> = [
      { path: '/inventory/inbound', perm: 'inventory.*' },
      { path: '/inventory/items', perm: 'inventory.*' },
      { path: '/morning-check', perm: 'daily.*' },
      { path: '/analytics', perm: 'overview.*' },
      { path: '/system/users', perm: 'users.manage' },
    ];
    const target = candidates.find((c) => auth.hasPerm(c.perm));
    return next({ path: target ? target.path : '/login' });
  }
  next();
});

export default router;
