import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45 * 1000, // Increased timeout for production testing
  expect: {
    timeout: 10000, // Increased expect timeout
  },
  fullyParallel: true,
  forbidOnly: false,
  retries: 1, // Add retries for production testing
  workers: 1, // Single worker for stability
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/prod-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4174', // Production preview server
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer - use existing production preview server
  // Only run PWA and production-specific tests
  testMatch: [
    'tests/run-complete-test-suite.spec.ts',
    'tests/pwa/**/*.spec.ts',
    'tests/performance-security.spec.ts',
  ],
});
