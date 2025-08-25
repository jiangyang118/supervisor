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
  { path: '/morning-check', component: GenericPage, meta: { title: '晨检管理', actions: ['export-csv'] } },
  { path: '/sampling/records', component: GenericPage, meta: { title: '留样记录', actions: ['export-csv'] } },
  { path: '/sampling/cleanup', component: GenericPage, meta: { title: '样品清理记录', actions: ['export-csv'] } },
  { path: '/dine-with', component: GenericPage, meta: { title: '陪餐管理', actions: ['export-csv'] } },
  { path: '/pesticide-tests', component: () => import('../views/PesticideTests.vue') },
  { path: '/disinfection', component: () => import('../views/Disinfection.vue') },
  { path: '/waste', component: GenericPage, meta: { title: '废弃物管理', actions: ['export-csv'] } },
  { path: '/hygiene/inspections', component: GenericPage, meta: { title: '卫生检查台账', actions: ['export-csv'] } },
  { path: '/hygiene/assets', component: GenericPage, meta: { title: '固定资产维护台账', actions: ['export-csv'] } },

  // Inventory & suppliers
  { path: '/inventory/items', component: GenericPage, meta: { title: '商品管理', actions: ['export-csv'] } },
  { path: '/inventory/inbound', component: GenericPage, meta: { title: '入库登记', actions: ['export-csv'] } },
  { path: '/inventory/outbound', component: GenericPage, meta: { title: '出库登记', actions: ['export-csv'] } },
  { path: '/inventory/stock', component: GenericPage, meta: { title: '库存记录与盘点', actions: ['export-csv'] } },
  { path: '/inventory/tickets', component: GenericPage, meta: { title: '索票索证', actions: ['export-csv'] } },
  { path: '/inventory/additives', component: GenericPage, meta: { title: '食品添加剂使用记录', actions: ['export-csv'] } },
  { path: '/suppliers', component: GenericPage, meta: { title: '供应商管理', actions: ['export-csv'] } },
  { path: '/warehouses', component: GenericPage, meta: { title: '仓库信息管理', actions: ['export-csv'] } },
  { path: '/certificates', component: GenericPage, meta: { title: '资质证件管理', actions: ['export-csv'] } },

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
