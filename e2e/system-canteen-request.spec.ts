import { test, expect } from '@playwright/test';

test.describe('System Canteen API params', () => {
  const base = 'http://localhost:4201';

  test('requests school/canteens with schoolId=1&enabled=all', async ({ page }) => {
    let requestedUrl: string | undefined;

    // Set auth and permissions before app runs
    await page.addInitScript(() => {
      localStorage.setItem('AUTH_TOKEN', 'test-token');
      localStorage.setItem('AUTH_USER', JSON.stringify({ id: 't', name: 't', roles: ['admin'], permissions: ['*'] }));
      // Ensure no pre-selected school so default applies
      localStorage.removeItem('current-school-id');
    });

    await page.route('**/api/school/canteens**', async (route) => {
      requestedUrl = route.request().url();
      await route.fulfill({ status: 200, body: '[]', headers: { 'content-type': 'application/json' } });
    });

    await page.goto(`${base}/system/canteen`, { waitUntil: 'domcontentloaded' });

    // Wait a moment to ensure the request is made
    await page.waitForTimeout(300);

    expect(requestedUrl, 'canteens API was not requested').toBeTruthy();
    expect(requestedUrl!).toContain('/api/school/canteens');
    // schoolId defaults to 1 and enabled should be all on initial load
    expect(requestedUrl!).toContain('schoolId=1');
    expect(requestedUrl!).toContain('enabled=all');
  });
});
