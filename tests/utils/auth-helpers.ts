import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`,
  };
}

export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/');

  // Wait for the login form to be visible
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for either success or error
  await Promise.race([
    page.waitForURL('/dashboard', { timeout: 10000 }),
    page.waitForSelector('.text-red-600, .text-green-600', { timeout: 10000 }),
  ]);
}

export async function logoutUser(page: Page) {
  // Navigate to dashboard if not already there
  if (!page.url().includes('/dashboard')) {
    await page.goto('/dashboard');
  }

  // Click logout button
  await page.click('button:has-text("Sign Out")');

  // Wait for redirect to login page
  await page.waitForURL('/');
}

export async function expectToBeLoggedIn(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("text=You're logged in!")).toBeVisible();
}

export async function expectToBeLoggedOut(page: Page) {
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Welcome back! Please sign in')).toBeVisible();
}

export async function expectLoginError(page: Page, expectedError?: string) {
  if (expectedError) {
    await expect(page.locator('.text-red-600')).toContainText(expectedError);
  } else {
    await expect(page.locator('.text-red-600')).toBeVisible();
  }
}

export async function expectLoginSuccess(page: Page) {
  await expect(page.locator('.text-green-600')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function fillLoginForm(
  page: Page,
  email: string,
  password: string
) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
}

export async function submitLoginForm(page: Page) {
  await page.click('button[type="submit"]');
}

export async function waitForAuthState(
  page: Page,
  expectedState: 'logged-in' | 'logged-out'
) {
  if (expectedState === 'logged-in') {
    await page.waitForURL(/\/dashboard/);
  } else {
    await page.waitForURL('/');
  }
}
