<template>
  <div v-if="isAuthPage" class="auth-only">
    <router-view />
  </div>
  <el-container v-else style="height: 100vh">
    <el-header class="app-header" style="display: flex; align-items: center; justify-content: space-between">
      <div>监管端 • 食品安全云</div>
      <div style="display:flex; align-items:center; gap:12px">
        <el-button link type="primary" @click="go('/overview')">总览</el-button>
        <el-button v-if="has('reports.view')" link @click="go('/reports')">每日报表</el-button>
        <el-divider direction="vertical" />
        <el-dropdown>
          <span class="el-dropdown-link" style="cursor:pointer">
            {{ displayName }}<i class="el-icon-arrow-down el-icon--right" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="onLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="240px" class="app-aside">
        <el-menu :default-active="active" router unique-opened>
          <el-menu-item index="/overview">首页总览</el-menu-item>
          <el-menu-item v-if="has('reports.view')" index="/reports">每日报表</el-menu-item>
          <el-menu-item index="/big-screen">演示大屏</el-menu-item>
          <el-sub-menu index="ai">
            <template #title>智能巡查监管</template>
            <el-menu-item index="/ai/inspections">AI 抓拍明细</el-menu-item>
            <el-menu-item index="/ai/tasks">巡查任务</el-menu-item>
            <el-menu-item index="/ai/broadcast">远程喊话</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/bright-kitchen">明厨亮灶监管</el-menu-item>
          <el-sub-menu index="ledgers">
            <template #title>各类台账</template>
            <el-menu-item index="/ledgers/morning">晨检</el-menu-item>
            <el-menu-item index="/ledgers/sampling">留样</el-menu-item>
            <el-menu-item index="/ledgers/dine">陪餐</el-menu-item>
            <el-menu-item index="/ledgers/pesticide">农残</el-menu-item>
            <el-menu-item index="/ledgers/disinfection">消毒</el-menu-item>
            <el-menu-item index="/ledgers/waste">废弃物</el-menu-item>
            <el-menu-item index="/ledgers/inventory">出入库/索证/添加剂</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/certificates">资质证件监管</el-menu-item>
          <el-menu-item index="/training">培训考试监管</el-menu-item>
          <!-- 公示与反馈模块已下线：食品浪费监管、公示监管入口移除 -->
          <el-sub-menu index="inspections">
            <template #title>监督检查</template>
            <el-menu-item index="/inspections">任务管理</el-menu-item>
            <el-menu-item index="/inspections/inspectors">检查人员配置</el-menu-item>
            <el-menu-item index="/inspections/config">检查配置</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/warnings">预警汇总</el-menu-item>
          <el-menu-item index="/analytics">数据看版</el-menu-item>
          <el-menu-item index="/food-index">食安指数</el-menu-item>
          <el-sub-menu index="system">
            <template #title>系统配置</template>
            <el-menu-item v-if="has('settings.*')" index="/system/info">监管单位信息</el-menu-item>
            <el-menu-item v-if="has('users.manage')" index="/system/users">监管端用户配置</el-menu-item>
            <el-menu-item v-if="has('settings.*')" index="/system/app">APP 下载</el-menu-item>
            <el-menu-item v-if="has('settings.*')" index="/system/news">食安资讯</el-menu-item>
            <el-menu-item v-if="has('settings.*')" index="/system/linkage">平台关联</el-menu-item>
            <el-menu-item v-if="has('settings.*')" index="/system/school-accounts">学校账号配置</el-menu-item>
            <el-menu-item v-if="has('settings.*')" index="/system/schools">学校配置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-main>
        <PageHeader />
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useAuthStore } from './stores/auth';
import { ElMessageBox, ElMessage } from 'element-plus';
const route = useRoute();
const router = useRouter();
import PageHeader from './components/PageHeader.vue';
const active = computed(() => route.path);
const go = (p: string) => router.push(p);
const isAuthPage = computed(() => route.path === '/login');
const auth = useAuthStore();
const displayName = computed(() => auth.user?.name || '未登录');
const has = (p: string) => auth.hasPerm(p);
async function onLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    });
  } catch {
    return; // 用户取消
  }
  await auth.logout();
  ElMessage.success('已退出登录');
  router.replace('/login');
}
</script>

<style>
body {
  margin: 0;
}
.auth-only { min-height: 100vh; }
</style>
