import type { RouteLocationNormalizedLoaded } from 'vue-router';

const map: Record<string, string> = {
  '/overview': '首页',
  '/reports': '每日报表',
  // 父级分组（用于面包屑中文化）
  // 合并到明厨亮灶：AI 相关页面归属该分组
  '/ai': '明厨亮灶',
  '/bright-kitchen': '明厨亮灶',

  '/inventory': '出入库管理',
  '/inventory/items': '商品管理',
  '/inventory/inbound': '入库登记',
  '/inventory/outbound': '出库登记',
  '/inventory/stock': '库存记录',
  '/inventory/additives': '添加剂使用',

  // 资质证件管理
  '/hr': '资质证件管理',
  '/hr/staff':'人员资质',
  '/hr/staff/view':'人员资质详情',
  '/hr/canteen-licenses':'食堂资质',
  '/hr/suppliers':'供应商资质',
  '/system': '系统配置',
  '/ai/events': '违规抓拍明细',
  '/ai/summary': 'AI 抓拍统计',
  '/bright-kitchen/live': '实时视频',
  '/bright-kitchen/playback': '回放',
  '/bright-kitchen/snapshots': '快照留存',
  '/bright-kitchen/channels': '通道配置',
  // 日常运营管理
  '/daily-op': '日常运营管理',
  '/daily-op/morning-check': '晨检管理',
  '/daily-op/morning-check/detail': '晨检详情',
  '/daily-op/sampling': '留样记录',
  '/daily-op/environment':'环境监测管理',
  '/daily-op/sampling/cleanup': '样品清理',
  '/daily-op/dine-with': '陪餐管理',
  '/daily-op/pesticide-tests': '农残快检管理',
  '/daily-op/disinfection': '消毒管理',
  '/daily-op/waste': '废弃物管理',
  '/daily-op/device-safety': '设备安全管理',

  

  '/public-config': '公示内容配置',
  '/devices': '智能终端设备管理',
  

  '/overview/alerts': '预警概览',
  '/system/announcements': '公告公文管理',
  '/system/news': '食安资讯发布',
  '/system/canteen': '食堂信息维护',
  '/system/linkage': '关联监管端审核',
  '/system/app-download': '移动端扫码',
  '/system/users': '用户管理',
  '/system/roles':'角色管理'
};

export function titleForRoute(route: RouteLocationNormalizedLoaded): string {
  const p = route.path;
  return (route.meta?.title as string) || map[p] || '页面';
}

export function crumbsForRoute(route: RouteLocationNormalizedLoaded): string[] {
  const parts = route.path.split('/').filter(Boolean);
  const res: string[] = ['学校端'];
  let acc = '';
  for (const part of parts) {
    acc += '/' + part;
    res.push(map[acc] || part);
  }
  return res;
}
