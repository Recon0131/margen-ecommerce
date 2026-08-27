import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  projects: [
    { name: 'Desktop Chrome', use: { browserName: 'chromium' } },
    { name: 'Mobile Chrome', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
});
