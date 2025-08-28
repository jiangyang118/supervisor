<template>
  <el-container style="height: 100vh">
    <el-header
      class="app-header"
      style="display: flex; align-items: center; justify-content: space-between"
    >
      <div>监管端 • 食品安全云</div>
      <el-space>
        <el-button link type="primary" @click="go('/overview')">总览</el-button>
        <el-button link @click="go('/reports')">每日报表</el-button>
      </el-space>
    </el-header>
    <el-container>
      <el-aside width="240px" class="app-aside">
        <el-menu :default-active="active" router unique-opened>
          <el-menu-item index="/overview">首页总览</el-menu-item>
          <el-menu-item index="/reports">每日报表</el-menu-item>
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
          <el-menu-item index="/food-waste">食品浪费监管</el-menu-item>
          <el-menu-item index="/public">公示监管</el-menu-item>
          <el-sub-menu index="inspections">
            <template #title>监督检查</template>
            <el-menu-item index="/inspections">任务管理</el-menu-item>
            <el-menu-item index="/inspections/inspectors">检查人员配置</el-menu-item>
            <el-menu-item index="/inspections/config">检查配置</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/warnings">预警汇总</el-menu-item>
          <el-menu-item index="/analytics">大数据统计</el-menu-item>
          <el-menu-item index="/food-index">食安指数</el-menu-item>
          <el-sub-menu index="system">
            <template #title>系统配置</template>
            <el-menu-item index="/system/info">监管单位信息</el-menu-item>
            <el-menu-item index="/system/users">用户与角色</el-menu-item>
            <el-menu-item index="/system/app">APP 下载</el-menu-item>
            <el-menu-item index="/system/news">食安资讯</el-menu-item>
            <el-menu-item index="/system/linkage">平台关联</el-menu-item>
            <el-menu-item index="/system/roles">角色权限</el-menu-item>
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
const route = useRoute();
const router = useRouter();
import PageHeader from './components/PageHeader.vue';
const active = computed(() => route.path);
const go = (p: string) => router.push(p);
</script>

<style>
body {
  margin: 0;
}
</style>
