import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000, // Reduced timeout for faster feedback
  expect: {
    timeout: 5000, // Reduced expect timeout
  },
  fullyParallel: true,
  forbidOnly: false,
  retries: 0, // No retries for faster development
  workers: 1, // Single worker for stability
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off', // Disable tracing for speed
    screenshot: 'only-on-failure',
    video: 'off', // Disable video for speed
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Use existing Docker server instead of starting new one
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  //   timeout: 60 * 1000,
  // },
  // Only run essential test files for development
  testMatch: [
    'tests/auth/**/*.spec.ts',
    'tests/core/**/*.spec.ts',
    'tests/e2e/**/*.spec.ts',
  ],
});
