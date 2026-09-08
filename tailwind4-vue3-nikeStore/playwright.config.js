import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5179 --strictPort',
    url: 'http://127.0.0.1:5179',
    reuseExistingServer: false,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5179',
    // Use Playwright's bundled Chromium unless a browser channel is requested.
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
})
