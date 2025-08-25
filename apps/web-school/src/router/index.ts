import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const Home = () => import('../views/Home.vue');
const Reports = () => import('../views/Reports.vue');
const GenericPage = () => import('../views/GenericPage.vue');

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'overview', component: Home },
  { path: '/reports', name: 'reports', component: Reports, meta: { title: '每日报表', actions: ['export-pdf','export-csv'] } },

  // AI & Bright Kitchen
  { path: '/ai/events', component: GenericPage, meta: { title: '违规抓拍明细', actions: ['export-csv','export-pdf'] } },
  { path: '/ai/summary', component: GenericPage, meta: { title: 'AI 抓拍统计', actions: ['export-csv','export-pdf'] } },
  { path: '/bright-kitchen/live', component: GenericPage, meta: { title: '实时视频', mainCol: '通道', actions: ['export-csv'] } },
  { path: '/bright-kitchen/playback', component: GenericPage, meta: { title: '回放', actions: ['export-csv'] } },
  { path: '/bright-kitchen/snapshots', component: GenericPage, meta: { title: '快照留存', actions: ['export-csv'] } },
  { path: '/bright-kitchen/channels', component: GenericPage, meta: { title: '通道配置', actions: ['export-csv'] } },

  // Operational ledgers
  { path: '/morning-check', component: () => import('../views/MorningCheck.vue') },
  { path: '/sampling/records', component: () => import('../views/SamplingRecords.vue') },
  { path: '/sampling/cleanup', component: () => import('../views/SamplingCleanup.vue') },
  { path: '/dine-with', component: () => import('../views/DineWith.vue') },
  { path: '/pesticide-tests', component: () => import('../views/PesticideTests.vue') },
  { path: '/disinfection', component: () => import('../views/Disinfection.vue') },
  { path: '/waste', component: () => import('../views/Waste.vue') },
  { path: '/hygiene/inspections', component: () => import('../views/HygieneInspections.vue') },
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

  // Training & public & waste
  { path: '/training/courses', component: GenericPage, meta: { title: '培训课程', actions: ['export-csv'] } },
  { path: '/training/exams', component: GenericPage, meta: { title: '考试管理', actions: ['export-csv'] } },
  { path: '/food-waste', component: GenericPage, meta: { title: '食品浪费管理', actions: ['export-csv'] } },
  { path: '/public-feedback', component: GenericPage, meta: { title: '公众投诉/建议/表扬/评论', actions: ['export-csv'] } },
  { path: '/public-config', component: GenericPage, meta: { title: '公示项配置', actions: ['export-csv'] } },

  // Emergency
  { path: '/emergency/overview', component: GenericPage, meta: { title: '应急概览', actions: ['export-csv'] } },
  { path: '/emergency/plans', component: GenericPage, meta: { title: '预案管理', actions: ['export-csv'] } },
  { path: '/emergency/duty', component: GenericPage, meta: { title: '值守管理', actions: ['export-csv'] } },
  { path: '/emergency/events', component: GenericPage, meta: { title: '事件/演练管理', actions: ['export-csv'] } },
  { path: '/emergency/command', component: GenericPage, meta: { title: '指挥调度', actions: ['export-csv'] } },
  { path: '/emergency/video', component: GenericPage, meta: { title: '视频监控管理', actions: ['export-csv'] } },
  { path: '/emergency/resources', component: GenericPage, meta: { title: '资源库', actions: ['export-csv'] } },

  // Risk & warnings & devices & analytics
  { path: '/risks', component: GenericPage, meta: { title: '隐患排查管理', actions: ['export-csv'] } },
  { path: '/warnings', component: GenericPage, meta: { title: '预警汇总', actions: ['export-csv'] } },
  { path: '/devices', component: GenericPage, meta: { title: '已接入设备信息', actions: ['export-csv'] } },
  { path: '/analytics', component: GenericPage, meta: { title: '大数据统计看板', actions: ['export-csv','export-pdf'] } },
  { path: '/food-index', component: GenericPage, meta: { title: '食安指数', actions: ['export-csv'] } },

  // System
  { path: '/system/announcements', component: GenericPage, meta: { title: '公告公文', actions: ['export-csv'] } },
  { path: '/system/canteen', component: GenericPage, meta: { title: '学校食堂信息维护', actions: ['export-csv'] } },
  { path: '/system/linkage', component: GenericPage, meta: { title: '与监管端关联', actions: ['export-csv'] } },
  { path: '/system/app-download', component: GenericPage, meta: { title: 'APP 下载', actions: [] } },
  { path: '/system/meals', component: GenericPage, meta: { title: '餐次设置', actions: ['export-csv'] } },
  { path: '/system/users', component: GenericPage, meta: { title: '用户/角色/RBAC', actions: ['export-csv'] } },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
