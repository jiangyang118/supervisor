import { test, expect } from '@playwright/test';

test.describe('学校端页面可达性', () => {
  test('首页与菜单跳转', async ({ page }) => {
    await page.goto('http://localhost:4200/overview', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/学校端/);
    await expect(page.getByText('学校基础数据')).toBeVisible();

    await page.goto('http://localhost:4200/pesticide-tests', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('农残快检管理')).toBeVisible();

    await page.goto('http://localhost:4200/disinfection', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main').getByText('消毒管理')).toBeVisible();
  });
});
