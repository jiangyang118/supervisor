import { test, expect } from '@playwright/test';

test.describe('监管端台账可达性', () => {
  test('农残与消毒台账页面', async ({ page }) => {
    await page.goto('http://localhost:4300/ledgers/pesticide', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/监管端/);
    await expect(page.getByText('农残台账')).toBeVisible();

    await page.goto('http://localhost:4300/ledgers/disinfection', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText('消毒台账')).toBeVisible();
  });
});
