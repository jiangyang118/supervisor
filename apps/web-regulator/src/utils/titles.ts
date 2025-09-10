import type { RouteLocationNormalizedLoaded } from 'vue-router';

const map: Record<string, string> = {
  '/overview': '首页总览',
  '/reports': '每日报表',
  '/big-screen': '演示大屏',
  // 父级分组（用于面包屑中文化）
  '/ai': '智能巡查监管',
  '/ledgers': '学校台账监管',
  '/system': '系统管理',
  '/ai/inspections': 'AI 抓拍明细',
  '/ai/tasks': '巡查任务',
  '/ai/broadcast': '远程喊话',
  '/bright-kitchen': '明厨亮灶监管',
  '/ledgers/morning': '晨检台账',
  '/ledgers/sampling': '留样台账',
  '/ledgers/dine': '陪餐台账',
  '/ledgers/pesticide': '农残台账',
  '/ledgers/disinfection': '消毒台账',
  '/ledgers/waste': '废弃物台账',
  '/ledgers/inventory': '出入库/索证/添加剂',
  '/certificates': '资质证件监管',
  '/food-waste': '食品浪费监管',
  '/public': '公示监管',
  '/inspections': '监督检查',
  '/warnings': '预警汇总',
  '/analytics': '数据看板',
  '/food-index': '食安指数',
  '/system/info': '监管单位信息',
  '/system/users': '监管端用户配置',
  '/system/app': 'APP 下载',
};

export function titleForRoute(route: RouteLocationNormalizedLoaded): string {
  const p = route.path;
  return (route.meta?.title as string) || map[p] || '页面';
}

export function crumbsForRoute(route: RouteLocationNormalizedLoaded): string[] {
  const parts = route.path.split('/').filter(Boolean);
  const res: string[] = ['监管端'];
  let acc = '';
  for (const part of parts) {
    acc += '/' + part;
    res.push(map[acc] || part);
  }
  return res;
}
