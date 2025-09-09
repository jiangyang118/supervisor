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
  { path: '/overview', name: 'overview', component: Home },
  {
    path: '/reports',
    name: 'reports',
    component: Reports,
    meta: { title: '每日报表', actions: ['export-pdf', 'export-csv'] },
  },

  // AI & Bright Kitchen
  { path: '/ai/events', component: () => import('../views/AiEvents.vue') },
  { path: '/ai/summary', component: () => import('../views/AiSummary.vue') },
  { path: '/bright-kitchen/live', component: () => import('../views/bright/BrightLive.vue') },
  {
    path: '/bright-kitchen/playback',
    component: () => import('../views/bright/BrightPlayback.vue'),
  },
  {
    path: '/bright-kitchen/snapshots',
    component: () => import('../views/bright/BrightSnapshots.vue'),
  },
  {
    path: '/bright-kitchen/channels',
    component: () => import('../views/bright/BrightChannels.vue'),
  },
  { path: '/system/trustivs-test', component: () => import('../views/TrustivsTest.vue') },

  // Operational ledgers
  { path: '/morning-check', component: () => import('../views/MorningCheck.vue') },
  { path: '/sampling/records', component: () => import('../views/SamplingRecords.vue') },
  { path: '/dine-with', component: () => import('../views/DineWith.vue') },
  { path: '/pesticide-tests', component: () => import('../views/PesticideTests.vue') },
  { path: '/disinfection', component: () => import('../views/Disinfection.vue') },
  { path: '/waste', component: () => import('../views/Waste.vue') },
  { path: '/hygiene/inspections', component: () => import('../views/HygieneInspections.vue') },
  { path: '/system/news', component: () => import('../views/SystemNews.vue') },
  { path: '/hygiene/assets', component: () => import('../views/AssetMaintenance.vue') },

  // Inventory & suppliers
  { path: '/inventory/items', component: () => import('../views/InventoryItems.vue') },
  { path: '/inventory/inbound', component: () => import('../views/InventoryInbound.vue') },
  { path: '/inventory/outbound', component: () => import('../views/InventoryOutbound.vue') },
  { path: '/inventory/stock', component: () => import('../views/InventoryStock.vue') },
  { path: '/inventory/tickets', component: () => import('../views/InventoryTickets.vue') },
  { path: '/inventory/additives', component: () => import('../views/InventoryAdditives.vue') },
  { path: '/suppliers', component: () => import('../views/Suppliers.vue') },
  { path: '/warehouses', component: () => import('../views/Warehouses.vue') },
  { path: '/certificates', component: () => import('../views/Certificates.vue') },
  // Environment & devices
  { path: '/environment/status', component: () => import('../views/EnvironmentStatus.vue') },

  // Training & public & waste
  { path: '/training', component: () => import('../views/Training.vue') },
  { path: '/training/courses', redirect: { path: '/training', query: { tab: 'courses' } } },
  { path: '/training/exams', redirect: { path: '/training', query: { tab: 'exams' } } },
  { path: '/food-waste', component: () => import('../views/FoodWaste.vue') },
  { path: '/public-feedback', component: () => import('../views/PublicFeedback.vue') },
  { path: '/public-config', component: () => import('../views/PublicConfig.vue') },


  // Risk & warnings & devices & analytics
  { path: '/risks', component: () => import('../views/Risks.vue') },
  { path: '/warnings', component: () => import('../views/Warnings.vue') },
  { path: '/devices', component: () => import('../views/Devices.vue') },
  { path: '/analytics', component: () => import('../views/Analytics.vue') },
  { path: '/food-index', redirect: { path: '/overview/alerts' } },
  { path: '/warnings', redirect: { path: '/overview/alerts' } },
  // Overview combined
  { path: '/overview/alerts', component: () => import('../views/AlertsOverview.vue') },
  // Mobile H5 for risk task
  { path: '/risk/task/:id', component: () => import('../views/RiskTaskH5.vue') },

  // System
  { path: '/system/announcements', component: () => import('../views/SystemAnnouncements.vue') },
  { path: '/system/canteen', component: () => import('../views/SystemCanteen.vue') },
  { path: '/system/linkage', component: () => import('../views/SystemLinkage.vue') },
  { path: '/system/app-download', component: () => import('../views/SystemApp.vue') },
  { path: '/system/users', component: () => import('../views/SystemUsers.vue'), meta: { perms: ['users.manage'] } },
  { path: '/system/roles', component: () => import('../views/SystemRoles.vue'), meta: { perms: ['users.manage'] } },
  { path: '/hr/staff', component: () => import('../views/StaffManagement.vue') },
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
    // no permission → fallback to overview
    return next({ path: '/overview' });
  }
  next();
});

export default router;
