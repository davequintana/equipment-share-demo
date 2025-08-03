import { defineConfig, devices } from '@playwright/test';

// Configure workers based on environment
const getWorkerCount = () => {
  if (process.env.PLAYWRIGHT_WORKERS) {
    return parseInt(process.env.PLAYWRIGHT_WORKERS, 10);
  }
  if (process.env.CI) {
    return 3; // 3 workers for CI
  }
  return undefined; // Use Playwright's default (based on CPU cores)
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: getWorkerCount(),
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  timeout: 10000, // 10 second timeout per test
  expect: {
    timeout: 10000, // 10 second timeout for assertions
  },
  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10 second timeout for actions
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        headless: true,
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        headless: true,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        headless: true,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        headless: true,
      },
    },
  ],

  webServer: [
    {
      command: 'pnpm run serve:web-app',
      port: 4201,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm run serve:fastify-api',
      port: 3334,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
