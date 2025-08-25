import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('../views/Home.vue');
const Reports = () => import('../views/Reports.vue');

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/reports', name: 'reports', component: Reports },
  ],
});

