import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const Dashboard = () => import('../pages/dashboard/index.vue')
const Todo = () => import('../pages/todo/index.vue')
const Ledger = () => import('../pages/ledger/index.vue')
const Warn = () => import('../pages/warn/index.vue')
const Mine = () => import('../pages/mine/index.vue')

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, meta: { title: '总览', tab: true } },
  { path: '/todo', component: Todo, meta: { title: '工作', tab: true } },
  { path: '/ledger', component: Ledger, meta: { title: '台账', tab: true } },
  { path: '/warn', component: Warn, meta: { title: '预警', tab: true } },
  { path: '/mine', component: Mine, meta: { title: '我的', tab: true } },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

