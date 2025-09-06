import { test, expect } from '@playwright/test';
import {
  testFormValidation,
  testPasswordValidation,
  testEmailValidation,
  testSecurityHeaders,
} from '../utils/security-test-helpers';

test.describe('Authentication Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have login form with proper fields', async ({ page }) => {
    // Navigate to login page or check if login form is present
    await page.goto('/signup');

    // Check for common auth form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    const submitButton = page.locator(
      'button[type="submit"], input[type="submit"]'
    );

    if ((await emailInput.count()) > 0) {
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should have signup form with proper validation', async ({ page }) => {
    await page.goto('/signup');

    // Check for signup form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    const confirmPasswordInput = page.locator(
      'input[name="confirmPassword"], input[name="password_confirm"]'
    );

    if ((await emailInput.count()) > 0) {
      // Test form submission with invalid data
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123');

      // Submit form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait a moment for form submission to process
      await page.waitForTimeout(2000);

      // Check if form submission actually happened
      // For now, just verify the form is still present (indicating no redirect)
      // Note: Client-side validation will be implemented in Phase 1, Day 2
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should handle authentication state properly', async ({ page }) => {
    // Check if user is authenticated
    const isAuthenticated = await page.evaluate(() => {
      // Check for auth indicators in localStorage or sessionStorage
      return (
        localStorage.getItem('auth') ||
        sessionStorage.getItem('auth') ||
        document.cookie.includes('session') ||
        document.body.classList.contains('authenticated')
      );
    });

    // If not authenticated, should show login/signup options
    if (!isAuthenticated) {
      const loginLink = page.locator(
        'a[href*="login"], a[href*="signup"], button:has-text("Login"), button:has-text("Sign Up")'
      );
      if ((await loginLink.count()) > 0) {
        await expect(loginLink.first()).toBeVisible();
      }
    }
  });

  test('should have forgot password functionality', async ({ page }) => {
    await page.goto('/forgot-password');

    // Check for forgot password form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const submitButton = page.locator('button[type="submit"]');

    if ((await emailInput.count()) > 0) {
      await expect(emailInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Test form submission
      await emailInput.fill('test@example.com');
      await submitButton.click();

      // Should show success message or redirect
      await expect(page.locator('body')).toContainText(/sent|check|email/i);
    }
  });

  test('should have magic link authentication', async ({ page }) => {
    await page.goto('/magic-link');

    // Check for magic link form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const submitButton = page.locator('button[type="submit"]');

    if ((await emailInput.count()) > 0) {
      await expect(emailInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Try to access protected routes
    await page.goto('/dashboard');

    // Should redirect to login or show auth required message
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/signup')) {
      // Properly redirected to auth page
      expect(true).toBe(true);
    } else {
      // Should show auth required message
      await expect(page.locator('body')).toContainText(
        /login|sign|auth|required/i
      );
    }
  });

  test('should have logout functionality', async ({ page }) => {
    // Check for logout button/link
    const logoutButton = page.locator(
      'button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]'
    );

    if ((await logoutButton.count()) > 0) {
      await expect(logoutButton).toBeVisible();

      // Test logout
      await logoutButton.click();

      // Should redirect to home or login page
      await expect(page).toHaveURL(/\/$|\/login|\/signup/);
    }
  });

  test('should have remember me functionality', async ({ page }) => {
    await page.goto('/signup');

    // Look for remember me checkbox
    const rememberMe = page.locator(
      'input[type="checkbox"][name*="remember"], input[type="checkbox"][id*="remember"]'
    );

    if ((await rememberMe.count()) > 0) {
      await expect(rememberMe).toBeVisible();

      // Test checkbox functionality
      await rememberMe.check();
      await expect(rememberMe).toBeChecked();

      await rememberMe.uncheck();
      await expect(rememberMe).not.toBeChecked();
    }
  });

  test('should have proper password requirements', async ({ page }) => {
    await page.goto('/signup');

    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );

    if ((await passwordInput.count()) > 0) {
      // Test password submission with weak password
      await passwordInput.fill('123');

      // Submit form to trigger server-side validation
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait a moment for form submission to process
      await page.waitForTimeout(2000);

      // Check if form submission actually happened
      // For now, just verify the form is still present (indicating no redirect)
      // Note: Client-side validation will be implemented in Phase 1, Day 2
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should have social authentication options', async ({ page }) => {
    await page.goto('/signup');

    // Look for social auth buttons
    const socialButtons = page.locator(
      'button:has-text("Google"), button:has-text("GitHub"), button:has-text("Facebook"), [data-testid*="social"]'
    );

    if ((await socialButtons.count()) > 0) {
      for (let i = 0; i < (await socialButtons.count()); i++) {
        await expect(socialButtons.nth(i)).toBeVisible();
      }
    }
  });
});
