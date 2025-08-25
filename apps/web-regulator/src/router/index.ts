import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const Dashboard = () => import('../views/Dashboard.vue');
const GenericPage = () => import('../views/GenericPage.vue');
const BigScreen = () => import('../views/BigScreen.vue');

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'dashboard', component: Dashboard },
  { path: '/reports', component: GenericPage, meta: { title: '辖区每日报表', actions: ['export-pdf','export-csv'] } },
  { path: '/ai/inspections', component: GenericPage, meta: { title: 'AI 抓拍明细', actions: ['export-csv','export-pdf'] } },
  { path: '/ai/tasks', component: GenericPage, meta: { title: '巡查任务', actions: ['export-csv'] } },
  { path: '/ai/broadcast', component: GenericPage, meta: { title: '远程喊话', actions: [] } },
  { path: '/bright-kitchen', component: GenericPage, meta: { title: '明厨亮灶监管', actions: ['export-csv'] } },
  { path: '/ledgers/morning', component: GenericPage, meta: { title: '晨检台账', actions: ['export-csv'] } },
  { path: '/ledgers/sampling', component: GenericPage, meta: { title: '留样台账', actions: ['export-csv'] } },
  { path: '/ledgers/dine', component: GenericPage, meta: { title: '陪餐台账', actions: ['export-csv'] } },
  { path: '/ledgers/pesticide', component: () => import('../views/LedgerPesticide.vue') },
  { path: '/ledgers/disinfection', component: () => import('../views/LedgerDisinfection.vue') },
  { path: '/ledgers/waste', component: GenericPage, meta: { title: '废弃物台账', actions: ['export-csv'] } },
  { path: '/ledgers/inventory', component: GenericPage, meta: { title: '出入库/索证/添加剂', actions: ['export-csv'] } },
  { path: '/certificates', component: GenericPage, meta: { title: '资质证件监管', actions: ['export-csv'] } },
  { path: '/training', component: GenericPage, meta: { title: '培训考试监管', actions: ['export-csv'] } },
  { path: '/food-waste', component: GenericPage, meta: { title: '食品浪费监管', actions: ['export-csv'] } },
  { path: '/public', component: GenericPage, meta: { title: '公示监管', actions: ['export-csv'] } },
  { path: '/inspections', component: GenericPage, meta: { title: '监督检查', actions: ['export-csv'] } },
  { path: '/warnings', component: GenericPage, meta: { title: '预警汇总', actions: ['export-csv'] } },
  { path: '/analytics', component: GenericPage, meta: { title: '大数据统计', actions: ['export-csv','export-pdf'] } },
  { path: '/food-index', component: GenericPage, meta: { title: '食安指数', actions: ['export-csv'] } },
  { path: '/big-screen', component: BigScreen, meta: { title: '演示大屏' } },
  { path: '/system/info', component: GenericPage, meta: { title: '监管单位信息', actions: [] } },
  { path: '/system/users', component: GenericPage, meta: { title: '用户与角色', actions: ['export-csv'] } },
  { path: '/system/app', component: GenericPage, meta: { title: 'APP 下载', actions: [] } },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
