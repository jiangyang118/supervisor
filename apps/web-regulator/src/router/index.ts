import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const Dashboard = () => import('../views/Dashboard.vue');
const GenericPage = () => import('../views/GenericPage.vue');
const BigScreen = () => import('../views/BigScreen.vue');

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/logout', meta: { public: true }, beforeEnter: (_to, _from, next) => {
    const auth = useAuthStore();
    auth.logout();
    next({ path: '/login' });
  } },
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'dashboard', component: Dashboard },
  { path: '/reports', component: () => import('../views/Reports.vue'), meta: { perms: ['report:EX', 'report:R', 'reports.view'] } },
  // Restrict system config routes based on permissions for display/guard
  { path: '/system/users', component: () => import('../views/SystemUsers.vue'), meta: { perms: ['users.manage'] } },
  { path: '/ai/inspections', component: () => import('../views/AiInspections.vue') },
  { path: '/ai/tasks', component: () => import('../views/AiTasks.vue') },
  { path: '/ai/broadcast', component: () => import('../views/AiBroadcast.vue') },
  { path: '/bright-kitchen', component: () => import('../views/BrightKitchen.vue') },
  { path: '/ledgers/morning', component: () => import('../views/LedgerMorning.vue') },
  { path: '/ledgers/sampling', component: () => import('../views/LedgerSampling.vue') },
  { path: '/ledgers/dine', component: () => import('../views/LedgerDine.vue') },
  { path: '/ledgers/pesticide', component: () => import('../views/LedgerPesticide.vue') },
  { path: '/ledgers/disinfection', component: () => import('../views/LedgerDisinfection.vue') },
  { path: '/ledgers/waste', component: () => import('../views/LedgerWaste.vue') },
  { path: '/ledgers/inventory', component: () => import('../views/LedgerInventory.vue') },
  { path: '/certificates', component: () => import('../views/Certificates.vue') },
  { path: '/food-waste', component: () => import('../views/FoodWaste.vue') },
  { path: '/public', component: () => import('../views/PublicOversight.vue') },
  { path: '/inspections', component: () => import('../views/Inspections.vue') },
  { path: '/inspections/inspectors', component: () => import('../views/Inspectors.vue') },
  { path: '/inspections/config', component: () => import('../views/InspectionsConfig.vue') },
  { path: '/warnings', component: () => import('../views/Warnings.vue') },
  { path: '/analytics', component: () => import('../views/Analytics.vue') },
  { path: '/food-index', component: () => import('../views/FoodIndex.vue') },
  { path: '/big-screen', component: BigScreen, meta: { title: '演示大屏' } },
  { path: '/system/info', component: () => import('../views/SystemInfo.vue') },
  { path: '/system/app', component: () => import('../views/SystemApp.vue') },
  { path: '/system/news', component: () => import('../views/SystemNews.vue') },
  { path: '/system/linkage', component: () => import('../views/SystemLinkage.vue') },
  
  { path: '/system/schools', component: () => import('../views/SystemSchools.vue') },
  { path: '/system/school-accounts', component: () => import('../views/SystemSchoolAccounts.vue') },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta?.public) return next();
  if (!auth.isAuthed) {
    auth.setReturnTo(to.fullPath || '/overview');
    return next({ path: '/login' });
  }
  const required = (to.meta?.perms as string[] | undefined) || [];
  if (required.length && !required.some((p) => auth.hasPerm(p))) {
    return next({ path: '/overview' });
  }
  next();
});

export default router;
