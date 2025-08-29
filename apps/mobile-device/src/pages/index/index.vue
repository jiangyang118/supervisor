<template>
  <view class="page">
    <view class="header">
      <text class="title">设备管理平台（演示）</text>
      <button class="refresh" size="mini" @click="refresh">刷新</button>
    </view>

    <view class="section">
      <van-button type="primary" block @click="goPick">选择学校与食堂</van-button>
    </view>

    <view class="section card">
      <van-grid :column-num="3">
        <van-grid-item icon="search" text="智能检查" @click="go('/pages/inspections/smart')" />
        <van-grid-item icon="eye-o" text="实时监控" @click="go('/pages/monitor/index')" />
        <van-grid-item icon="notes-o" text="食堂日报" @click="go('/pages/reports/daily')" />
        <van-grid-item icon="todo-list-o" text="今日待办" @click="go('/pages/todos/index')" />
        <van-grid-item icon="friends-o" text="工勤健康" @click="go('/pages/health/index')" />
      </van-grid>
    </view>

    <view class="section card">
      <text class="subtle">示例设备列表</text>
      <view class="list">
        <view class="list-item">网关 • 在线</view>
        <view class="list-item muted">分析器 • 离线</view>
        <van-button size="small" class="muted" style="margin-top:8px;" plain type="primary" @click="refresh">刷新示例</van-button>
      </view>
    </view>

    <view class="section card">
      <text class="subtle">设备信息</text>
      <view v-if="deviceInfo" class="kv">
        <view class="row"><text class="k">品牌</text><text class="v">{{ deviceInfo.brand || '-' }}</text></view>
        <view class="row"><text class="k">型号</text><text class="v">{{ deviceInfo.model || '-' }}</text></view>
        <view class="row"><text class="k">系统</text><text class="v">{{ deviceInfo.system || '-' }}</text></view>
        <view class="row"><text class="k">平台</text><text class="v">{{ deviceInfo.platform || '-' }}</text></view>
        <view class="row"><text class="k">App版本</text><text class="v">{{ deviceInfo.version || '-' }}</text></view>
        <view class="row"><text class="k">SDK</text><text class="v">{{ deviceInfo.SDKVersion || '-' }}</text></view>
        <view class="row"><text class="k">DPR</text><text class="v">{{ deviceInfo.devicePixelRatio || '-' }}</text></view>
        <view class="row"><text class="k">屏幕</text><text class="v">{{ deviceInfo.screen }}</text></view>
        <view class="row"><text class="k">窗口</text><text class="v">{{ deviceInfo.window }}</text></view>
        <view class="row"><text class="k">语言</text><text class="v">{{ deviceInfo.language || '-' }}</text></view>
        <view class="row"><text class="k">主题</text><text class="v">{{ deviceInfo.theme || '-' }}</text></view>
        <view class="row"><text class="k">网络</text><text class="v">{{ netType }}</text></view>
        <view class="row" v-if="battery"><text class="k">电量</text><text class="v">{{ battery.level }}%（{{ battery.isCharging ? '充电中' : '未充电' }}）</text></view>
      </view>
      <view v-else class="placeholder">正在读取设备信息…</view>
    </view>
  </view>
  
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

type BatteryInfo = { level: number; isCharging: boolean }

const deviceInfo = ref<any>(null)
const netType = ref('unknown')
const battery = ref<BatteryInfo | null>(null)

function loadSystemInfo() {
  try {
    const sys = uni.getSystemInfoSync()
    deviceInfo.value = {
      brand: (sys as any).brand,
      model: sys.model,
      system: sys.system,
      platform: sys.platform,
      version: (sys as any).version,
      SDKVersion: (sys as any).SDKVersion,
      devicePixelRatio: sys.pixelRatio || (sys as any).devicePixelRatio,
      screen: `${sys.screenWidth}×${sys.screenHeight}`,
      window: `${sys.windowWidth}×${sys.windowHeight}`,
      language: (sys as any).language,
      theme: (sys as any).theme,
    }
  } catch (e) {
    deviceInfo.value = {}
  }
}

function loadNetwork() {
  try {
    uni.getNetworkType({
      success: (res) => (netType.value = res.networkType || 'unknown'),
      fail: () => (netType.value = 'unknown'),
    })
  } catch {
    netType.value = 'unknown'
  }
}

function loadBattery() {
  // 不同平台兼容，H5 可能不支持
  try {
    // @ts-ignore
    if (uni.getBatteryInfo) {
      // @ts-ignore
      uni.getBatteryInfo({
        success: (res: any) => {
          battery.value = { level: Math.round((res.level || 0) * 100) || res.level, isCharging: !!res.isCharging }
        },
      })
    }
  } catch {
    battery.value = null
  }
}

function refresh() {
  loadSystemInfo()
  loadNetwork()
  loadBattery()
}

function goPick() {
  uni.navigateTo({ url: '/pages/schools/index' })
}

function go(url: string) {
  uni.navigateTo({ url })
}

onMounted(() => {
  refresh()
})
</script>

<style></style>
