import type { RouteLocationNormalizedLoaded } from 'vue-router';

const map: Record<string, string> = {
  '/overview': '首页',
  '/reports': '每日报表',
  // 父级分组（用于面包屑中文化）
  // 合并到明厨亮灶：AI 相关页面归属该分组
  '/ai': '明厨亮灶',
  '/bright-kitchen': '明厨亮灶',
  '/sampling': '留样管理',
  '/inventory': '出入库/食材',
  '/inventory/items': '商品管理',
  '/system': '系统配置',
  '/ai/events': '违规抓拍明细',
  '/ai/summary': 'AI 抓拍统计',
  '/bright-kitchen/live': '实时视频',
  '/bright-kitchen/playback': '回放',
  '/bright-kitchen/snapshots': '快照留存',
  '/bright-kitchen/channels': '通道配置',
  '/morning-check': '晨检管理',
  '/sampling/records': '留样记录',
  '/sampling/cleanup': '样品清理',
  '/dine-with': '陪餐管理',
  '/pesticide-tests': '农残快检管理',
  '/disinfection': '消毒管理',
  '/waste': '废弃物管理',
  '/device-safety': '设备安全管理',
  // 卫生管理模块已下线
  
  '/inventory/inbound': '入库登记',
  '/inventory/outbound': '出库登记',
  '/inventory/stock': '库存记录',
  '/inventory/tickets': '索票索证',
  '/inventory/additives': '添加剂使用',
  '/suppliers': '供应商资质',
  // '/warehouses': '仓库信息管理' // 已下线
  '/public-config': '公示内容配置',
  '/devices': '智能终端设备管理',
  '/environment/monitor': '环境监测管理',

  '/overview/alerts': '预警概览',
  '/system/announcements': '公告公文管理',
  '/system/news': '食安资讯发布',
  '/system/canteen': '食堂信息维护',
  '/system/linkage': '关联监管端审核',
  '/system/app-download': '移动端扫码',
  '/system/users': '用户管理',
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
