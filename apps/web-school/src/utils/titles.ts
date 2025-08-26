import type { RouteLocationNormalizedLoaded } from 'vue-router';

const map: Record<string, string> = {
  '/overview': '首页',
  '/reports': '每日报表',
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
  '/pesticide-tests': '农残快检',
  '/disinfection': '消毒管理',
  '/waste': '废弃物管理',
  '/hygiene/inspections': '卫生检查台账',
  '/hygiene/assets': '固定资产维护台账',
  '/inventory/items': '商品管理',
  '/inventory/inbound': '入库登记',
  '/inventory/outbound': '出库登记',
  '/inventory/stock': '库存与盘点',
  '/inventory/tickets': '索票索证',
  '/inventory/additives': '添加剂使用',
  '/suppliers': '供应商管理',
  '/warehouses': '仓库信息',
  '/certificates': '资质证件',
  '/training/courses': '培训课程',
  '/training/exams': '考试管理',
  '/food-waste': '食品浪费管理',
  '/public-feedback': '公众反馈',
  '/public-config': '公示项配置',
  '/emergency/overview': '应急概览',
  '/emergency/plans': '预案管理',
  '/emergency/duty': '值守管理',
  '/emergency/events': '事件/演练管理',
  '/emergency/command': '指挥调度',
  '/emergency/video': '视频监控',
  '/emergency/resources': '资源库',
  '/risks': '隐患排查管理',
  '/warnings': '预警汇总',
  '/devices': '设备信息',
  '/analytics': '大数据统计',
  '/food-index': '食安指数',
  '/system/announcements': '公告公文',
  '/system/canteen': '学校食堂信息维护',
  '/system/linkage': '与监管端关联',
  '/system/app-download': 'APP 下载',
  '/system/meals': '餐次设置',
  '/system/users': '用户与角色',
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
