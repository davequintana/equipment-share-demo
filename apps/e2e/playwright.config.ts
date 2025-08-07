import { defineConfig, devices } from '@playwright/test';

// Configure workers based on environment
const getWorkerCount = () => {
  if (process.env.PLAYWRIGHT_WORKERS) {
    return parseInt(process.env.PLAYWRIGHT_WORKERS, 10);
  }
  if (process.env.CI) {
    return 6; // 6 workers for CI for faster execution
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
  timeout: process.env.CI ? 90000 : 20000, // 90 seconds for CI with more workers, 20 seconds for local
  expect: {
    timeout: process.env.CI ? 45000 : 15000, // 45 seconds for CI with more workers, 15 seconds for local
  },
  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: process.env.CI ? 45000 : 15000, // 45 seconds for CI with more workers, 15 seconds for local
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
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        headless: true,
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
    // Commenting out WebKit browsers due to missing system dependencies
    // Uncomment and install webkit dependencies if needed for full browser coverage
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     headless: true,
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //     headless: true,
    //   },
    // },
  ],

  webServer: [
    {
      command: 'NODE_OPTIONS="--no-deprecation --max-old-space-size=4096" pnpm run serve:web-app',
      port: 4201,
      reuseExistingServer: !process.env.CI,
      timeout: process.env.CI ? 300 * 1000 : 120 * 1000, // 5 minutes for CI with more workers, 2 minutes for local
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: process.env.CI ? 'bash -c "if [ -d dist/apps/fastify-api ]; then cd dist/apps/fastify-api && node main.js; else echo "fastify-api build not found, falling back to dev mode" && pnpm run serve:fastify-api; fi"' : 'NODE_OPTIONS="--no-deprecation --max-old-space-size=2048" pnpm run serve:fastify-api',
      port: 3334,
      reuseExistingServer: !process.env.CI,
      timeout: process.env.CI ? 300 * 1000 : 120 * 1000, // 5 minutes for CI with more workers, 2 minutes for local
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
