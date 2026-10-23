import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile 360px',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 740 },
        isMobile: true,
      },
    },
    {
      name: 'Mobile 390px',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
    {
      name: 'Tablet 768px',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        isMobile: false,
      },
    },
    {
      name: 'Desktop 1024px',
      use: {
        browserName: 'chromium',
        viewport: { width: 1024, height: 768 },
        isMobile: false,
      },
    },
    {
      name: 'Desktop 1440px',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        isMobile: false,
      },
    },
  ],
  webServer: {
    command: 'npm run preview',
    port: 5174,
    reuseExistingServer: true,
  },
});
