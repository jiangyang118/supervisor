import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: { headless: true, trace: 'on-first-retry', navigationTimeout: 45_000 },
  webServer: [
    {
      command: 'npm --prefix apps/web-school run dev',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm --prefix apps/web-regulator run dev',
      url: 'http://localhost:4300',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
};

export default config;
