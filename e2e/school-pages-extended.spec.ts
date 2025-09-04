import { test, expect } from '@playwright/test';

test.describe('学校端扩展页面可达性', () => {
  const base = 'http://localhost:4200';
  const go = async (page: any, path: string, marker: string) => {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main').getByText(marker)).toBeVisible();
  };

  test('AI 预警模块', async ({ page }) => {
    await go(page, '/ai/events', '智能检查/AI 预警 - 违规抓拍明细');
    await go(page, '/ai/summary', 'AI 抓拍统计');
  });

  test('明厨亮灶模块', async ({ page }) => {
    await go(page, '/bright-kitchen/live', '明厨亮灶 - 实时视频');
    await go(page, '/bright-kitchen/playback', '明厨亮灶 - 回放');
    await go(page, '/bright-kitchen/snapshots', '明厨亮灶 - 快照留存');
    await go(page, '/bright-kitchen/channels', '明厨亮灶 - 通道配置');
  });

  test('公示与预警', async ({ page }) => {
    await go(page, '/public-feedback', '公众投诉/建议/表扬/评论处理');
    await go(page, '/public-config', '公示项配置');
    await go(page, '/warnings', '预警汇总');
  });

  test('应急管理模块', async ({ page }) => {
    await go(page, '/emergency/overview', '应急管理 - 概览');
    await go(page, '/emergency/plans', '预案管理');
    await go(page, '/emergency/duty', '值守管理（小组/班组）');
    await go(page, '/emergency/events', '事件/演练管理');
    await go(page, '/emergency/command', '指挥调度（视频会议/任务）');
    await go(page, '/emergency/video', '视频监控（学校下摄像头流）');
    await go(page, '/emergency/resources', '资源库');
  });

  test('统计、设备与系统', async ({ page }) => {
    await go(page, '/devices', '已接入设备信息');
    await go(page, '/analytics', '数据看板');
    await go(page, '/food-index', '食安指数');
    await go(page, '/system/announcements', '公告公文');
    await go(page, '/system/canteen', '学校食堂信息维护');
    await go(page, '/system/linkage', '与监管端关联申请');
    await page.goto(`${base}/system/app-download`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main').getByText('APP 下载')).toBeVisible();
    await go(page, '/system/meals', '餐次设置');
    await go(page, '/system/users', '用户/角色/RBAC');
  });
});
