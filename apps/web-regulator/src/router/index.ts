import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const Dashboard = () => import('../views/Dashboard.vue');
const GenericPage = () => import('../views/GenericPage.vue');
const BigScreen = () => import('../views/BigScreen.vue');

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'dashboard', component: Dashboard },
  { path: '/reports', component: () => import('../views/Reports.vue') },
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
  { path: '/training', component: () => import('../views/Training.vue') },
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
  { path: '/system/users', component: () => import('../views/SystemUsers.vue') },
  { path: '/system/app', component: () => import('../views/SystemApp.vue') },
  { path: '/system/news', component: () => import('../views/SystemNews.vue') },
  { path: '/system/linkage', component: () => import('../views/SystemLinkage.vue') },
  { path: '/system/roles', component: () => import('../views/SystemRoles.vue') },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
