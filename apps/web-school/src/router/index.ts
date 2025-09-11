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
  { path: '/overview', name: 'overview', component: Home, meta: { perms: ['overview.*'] } },
  {
    path: '/reports',
    name: 'reports',
    component: Reports,
    meta: { title: '每日报表', actions: ['export-pdf', 'export-csv'], perms: ['overview.*'] },
  },

  // AI & Bright Kitchen
  { path: '/ai/events', component: () => import('../views/AiEvents.vue'), meta: { perms: ['bright.*'] } },
  { path: '/ai/summary', component: () => import('../views/AiSummary.vue'), meta: { perms: ['bright.*'] } },
  { path: '/bright-kitchen/live', component: () => import('../views/bright/BrightLive.vue'), meta: { perms: ['bright.*'] } },
  {
    path: '/bright-kitchen/playback',
    component: () => import('../views/bright/BrightPlayback.vue'),
    meta: { perms: ['bright.*'] },
  },
  {
    path: '/bright-kitchen/snapshots',
    component: () => import('../views/bright/BrightSnapshots.vue'),
    meta: { perms: ['bright.*'] },
  },
  {
    path: '/bright-kitchen/channels',
    component: () => import('../views/bright/BrightChannels.vue'),
    meta: { perms: ['bright.*'] },
  },
  { path: '/system/trustivs-test', component: () => import('../views/TrustivsTest.vue'), meta: { perms: ['system.*'] } },

  // Operational ledgers
  { path: '/morning-check', component: () => import('../views/MorningCheck.vue'), meta: { perms: ['daily.*'] } },
  { path: '/sampling/records', component: () => import('../views/SamplingRecords.vue'), meta: { perms: ['daily.*'] } },
  { path: '/dine-with', component: () => import('../views/DineWith.vue'), meta: { perms: ['daily.*'] } },
  { path: '/pesticide-tests', component: () => import('../views/PesticideTests.vue'), meta: { perms: ['daily.*'] } },
  { path: '/disinfection', component: () => import('../views/Disinfection.vue'), meta: { perms: ['daily.*'] } },
  { path: '/waste', component: () => import('../views/Waste.vue'), meta: { perms: ['daily.*'] } },
  { path: '/hygiene/inspections', component: () => import('../views/HygieneInspections.vue'), meta: { perms: ['daily.*'] } },
  { path: '/system/news', component: () => import('../views/SystemNews.vue'), meta: { perms: ['public.*'] } },
  { path: '/hygiene/assets', component: () => import('../views/AssetMaintenance.vue'), meta: { perms: ['env.*'] } },

  // Inventory & suppliers
  { path: '/inventory/items', component: () => import('../views/InventoryItems.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/inventory/inbound', component: () => import('../views/InventoryInbound.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/inventory/outbound', component: () => import('../views/InventoryOutbound.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/inventory/stock', component: () => import('../views/InventoryStock.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/inventory/tickets', component: () => import('../views/InventoryTickets.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/inventory/additives', component: () => import('../views/InventoryAdditives.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/suppliers', component: () => import('../views/Suppliers.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/suppliers/new', component: () => import('../views/SupplierEdit.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/suppliers/edit', component: () => import('../views/SupplierEdit.vue'), meta: { perms: ['inventory.*'] } },
  { path: '/warehouses', component: () => import('../views/Warehouses.vue'), meta: { perms: ['inventory.*'] } },
  // removed: personnel certificates
  // Environment & devices
  { path: '/environment/status', component: () => import('../views/EnvironmentStatus.vue'), meta: { perms: ['env.*'] } },

  // Public & waste
  { path: '/food-waste', component: () => import('../views/FoodWaste.vue'), meta: { perms: ['public.*'] } },
  { path: '/public-feedback', component: () => import('../views/PublicFeedback.vue'), meta: { perms: ['public.*'] } },
  { path: '/public-config', component: () => import('../views/PublicConfig.vue'), meta: { perms: ['public.*'] } },


  // Risk & warnings & devices & analytics
  { path: '/risks', component: () => import('../views/Risks.vue'), meta: { perms: ['env.*'] } },
  { path: '/warnings', component: () => import('../views/Warnings.vue'), meta: { perms: ['overview.*'] } },
  { path: '/devices', component: () => import('../views/Devices.vue'), meta: { perms: ['env.*'] } },
  { path: '/analytics', component: () => import('../views/Analytics.vue'), meta: { perms: ['overview.*'] } },
  { path: '/food-index', component: () => import('../views/FoodIndex.vue'), meta: { perms: ['overview.*'] } },
  // Overview combined
  { path: '/overview/alerts', component: () => import('../views/WarningOverview.vue'), meta: { perms: ['overview.*'] } },
  // Mobile H5 for risk task
  { path: '/risk/task/:id', component: () => import('../views/RiskTaskH5.vue') },

  // System
  { path: '/system/announcements', component: () => import('../views/SystemAnnouncements.vue'), meta: { perms: ['system.*'] } },
  { path: '/system/canteen', component: () => import('../views/SystemCanteen.vue'), meta: { perms: ['system.*'] } },
  { path: '/system/linkage', component: () => import('../views/SystemLinkage.vue'), meta: { perms: ['system.*'] } },
  { path: '/system/app-download', component: () => import('../views/SystemApp.vue'), meta: { perms: ['system.*'] } },
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
