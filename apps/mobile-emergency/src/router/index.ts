import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const Home = () => import('../views/Home.vue')
const Schools = () => import('../views/Schools.vue')
const SchoolDetail = () => import('../views/SchoolDetail.vue')
const Monitor = () => import('../views/Monitor.vue')
const Alerts = () => import('../views/Alerts.vue')
const Feedback = () => import('../views/Feedback.vue')
const Tasks = () => import('../views/Tasks.vue')
const News = () => import('../views/News.vue')
const Brief = () => import('../views/Brief.vue')
const SchoolLedgers = () => import('../views/SchoolLedgers.vue')

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/schools', component: Schools },
  { path: '/schools/:id', component: SchoolDetail },
  { path: '/monitor', component: Monitor },
  { path: '/alerts', component: Alerts },
  { path: '/feedback', component: Feedback },
  { path: '/tasks', component: Tasks },
  { path: '/news', component: News },
  { path: '/brief', component: Brief },
  { path: '/schools/:id/ledgers', component: SchoolLedgers },
]

export const router = createRouter({ history: createWebHashHistory(), routes })
