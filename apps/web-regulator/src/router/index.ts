import { createRouter, createWebHistory } from 'vue-router';

const Dashboard = () => import('../views/Dashboard.vue');

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
  ],
});

