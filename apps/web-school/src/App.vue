<template>
  <el-container style="height: 100vh">
    <el-header
      class="app-header"
      style="display: flex; align-items: center; justify-content: space-between"
    >
      <div>学校端 • 食品安全云</div>
      <el-space>
        <el-button link type="primary" @click="go('/overview')">首页</el-button>
        <el-button link @click="go('/reports')">每日报表</el-button>
      </el-space>
    </el-header>
    <el-container>
      <el-aside width="240px" class="app-aside">
        <el-menu :default-active="active" router unique-opened>
          <el-menu-item index="/overview">概览</el-menu-item>
          <el-sub-menu index="ai">
            <template #title>智能检查/AI 预警</template>
            <el-menu-item index="/ai/events">违规抓拍明细</el-menu-item>
            <el-menu-item index="/ai/summary">统计与导出</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="bright">
            <template #title>明厨亮灶</template>
            <el-menu-item index="/bright-kitchen/live">实时视频</el-menu-item>
            <el-menu-item index="/bright-kitchen/playback">回放</el-menu-item>
            <el-menu-item index="/bright-kitchen/snapshots">快照留存</el-menu-item>
            <el-menu-item index="/bright-kitchen/channels">通道配置</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/morning-check">晨检管理</el-menu-item>
          <el-sub-menu index="sampling">
            <template #title>留样管理</template>
            <el-menu-item index="/sampling/records">留样记录</el-menu-item>
            <el-menu-item index="/sampling/cleanup">样品清理</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/dine-with">陪餐管理</el-menu-item>
          <el-menu-item index="/pesticide-tests">农残快检</el-menu-item>
          <el-menu-item index="/disinfection">消毒管理</el-menu-item>
          <el-menu-item index="/waste">废弃物管理</el-menu-item>
          <el-sub-menu index="hygiene">
            <template #title>卫生检查</template>
            <el-menu-item index="/hygiene/inspections">卫生检查台账</el-menu-item>
            <el-menu-item index="/hygiene/assets">固定资产维护</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/inspections/tasks">监督检查任务</el-menu-item>
          <el-sub-menu index="inventory">
            <template #title>出入库/食材</template>
            <el-menu-item index="/inventory/items">商品管理</el-menu-item>
            <el-menu-item index="/inventory/inbound">入库登记</el-menu-item>
            <el-menu-item index="/inventory/outbound">出库登记</el-menu-item>
            <el-menu-item index="/inventory/stock">库存与盘点</el-menu-item>
            <el-menu-item index="/inventory/tickets">索票索证</el-menu-item>
            <el-menu-item index="/inventory/additives">添加剂使用</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/suppliers">供应商管理</el-menu-item>
          <el-menu-item index="/warehouses">仓库信息</el-menu-item>
          <el-menu-item index="/certificates">资质证件</el-menu-item>
          <el-sub-menu index="training">
            <template #title>培训考试</template>
            <el-menu-item index="/training/courses">培训课程</el-menu-item>
            <el-menu-item index="/training/exams">考试管理</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/food-waste">食品浪费</el-menu-item>
          <el-sub-menu index="public">
            <template #title>公示管理</template>
            <el-menu-item index="/public-feedback">公众反馈</el-menu-item>
            <el-menu-item index="/public-config">公示项配置</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="emergency">
            <template #title>应急管理</template>
            <el-menu-item index="/emergency/overview">概览</el-menu-item>
            <el-menu-item index="/emergency/plans">预案管理</el-menu-item>
            <el-menu-item index="/emergency/duty">值守管理</el-menu-item>
            <el-menu-item index="/emergency/events">事件/演练</el-menu-item>
            <el-menu-item index="/emergency/command">指挥调度</el-menu-item>
            <el-menu-item index="/emergency/video">视频监控</el-menu-item>
            <el-menu-item index="/emergency/resources">资源库</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/risks">隐患排查</el-menu-item>
          <el-menu-item index="/warnings">预警汇总</el-menu-item>
          <el-menu-item index="/devices">设备信息</el-menu-item>
          <el-menu-item index="/analytics">数据看板</el-menu-item>
          <el-menu-item index="/food-index">食安指数</el-menu-item>
          <el-sub-menu index="system">
            <template #title>系统配置</template>
            <el-menu-item index="/system/news">食安资讯</el-menu-item>
            <el-menu-item index="/system/info-center">资讯中心</el-menu-item>
            <el-menu-item index="/system/announcements">公告公文</el-menu-item>
            <el-menu-item index="/system/canteen">食堂信息</el-menu-item>
            <el-menu-item index="/system/linkage">关联监管端</el-menu-item>
            <el-menu-item index="/system/app-download">APP 下载</el-menu-item>
            <el-menu-item index="/system/meals">餐次设置</el-menu-item>
            <el-menu-item index="/system/users">用户与角色</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-main>
        <div v-if="!integration.base" class="integration-banner">
          <el-alert
            title="未检测到学校端集成服务地址（SCHOOL_INTEGRATION_BASE）"
            type="warning"
            :closable="false"
            description="请在 public/integration.config.json 配置，或在浏览器控制台/本页右侧设置中指定。"
            show-icon
          />
        </div>
        <div v-else class="integration-banner">
          <el-alert :closable="false" type="success" show-icon>
            <template #title>
              设备集成：{{ integration.base }}
            </template>
            <template #default>
              候选域名：{{ integration.candidates || '未配置' }}
              <el-button size="small" type="primary" text @click="testHealth">测试连接</el-button>
              <el-button size="small" text @click="openConfig">设置</el-button>
              <span v-if="healthOk === true" style="color:#67c23a">已连接</span>
              <span v-else-if="healthOk === false" style="color:#f56c6c">连接失败</span>
            </template>
          </el-alert>
        </div>
        <PageHeader />
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import PageHeader from './components/PageHeader.vue';
const route = useRoute();
const router = useRouter();
const active = computed(() => route.path);
const go = (p: string) => router.push(p);

const integration = computed(() => ({
  base: (window as any).SCHOOL_INTEGRATION_BASE as string | undefined,
  candidates: (window as any).MEGO_CANDIDATES as string | undefined,
}));

const healthOk = ref<boolean | null>(null);
async function testHealth() {
  healthOk.value = null;
  const base = integration.value.base;
  if (!base) return;
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/health`);
    healthOk.value = r.ok;
  } catch {
    healthOk.value = false;
  }
}

function openConfig() {
  const b = prompt('学校端集成服务地址 (SCHOOL_INTEGRATION_BASE):', integration.value.base || '');
  if (b !== null) {
    localStorage.setItem('SCHOOL_INTEGRATION_BASE', b);
    (window as any).SCHOOL_INTEGRATION_BASE = b;
  }
  const c = prompt('候选上游域名池 (MEGO_CANDIDATES):', integration.value.candidates || '');
  if (c !== null) {
    localStorage.setItem('MEGO_CANDIDATES', c);
    (window as any).MEGO_CANDIDATES = c;
  }
}
</script>

<style>
body {
  margin: 0;
}
.integration-banner { margin-bottom: 8px; }
</style>
