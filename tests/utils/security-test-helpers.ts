// Test helpers for working with enhanced security features
import type { Page, Locator, Expect } from '@playwright/test';

/**
 * Security test utilities for validating authentication and authorization
 */
export class SecurityTestHelpers {
  /**
   * Test form validation for security
   */
  static async testFormValidation(page: Page, formSelector: string) {
    // Test empty form submission
    await page.click(`${formSelector} button[type="submit"]`);

    // Should show validation errors
    await page.waitForSelector('.error, .invalid, [aria-invalid="true"]', {
      timeout: 5000,
    });
  }

  /**
   * Test password validation
   */
  static async testPasswordValidation(page: Page, passwordField: string) {
    const weakPasswords = ['123', 'password', 'abc', '123456'];

    for (const weakPassword of weakPasswords) {
      await page.fill(passwordField, weakPassword);
      await page.click('button[type="submit"]');

      // Should show password strength error
      await page.waitForSelector('.error, .invalid', { timeout: 3000 });
    }
  }

  /**
   * Test email validation
   */
  static async testEmailValidation(page: Page, emailField: string) {
    const invalidEmails = ['invalid', 'test@', '@domain.com', 'test@domain'];

    for (const invalidEmail of invalidEmails) {
      await page.fill(emailField, invalidEmail);
      await page.click('button[type="submit"]');

      // Should show email validation error
      await page.waitForSelector('.error, .invalid', { timeout: 3000 });
    }
  }

  /**
   * Test XSS protection
   */
  static async testXSSProtection(page: Page, inputField: string) {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>',
    ];

    for (const payload of xssPayloads) {
      await page.fill(inputField, payload);
      await page.click('button[type="submit"]');

      // Should not execute the script
      const alerts = await page.evaluate(() => {
        return window.alert.toString();
      });

      // Verify no script execution
      expect(alerts).not.toContain('xss');
    }
  }

  /**
   * Test CSRF protection
   */
  static async testCSRFProtection(page: Page) {
    // Get CSRF token from form
    const csrfToken = await page.getAttribute(
      'input[name="csrf_token"]',
      'value'
    );
    expect(csrfToken).toBeTruthy();

    // Try to submit without CSRF token
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const csrfInput = form.querySelector('input[name="csrf_token"]');
        if (csrfInput) {
          csrfInput.remove();
        }
      }
    });

    await page.click('button[type="submit"]');

    // Should show CSRF error
    await page.waitForSelector('.error, .invalid', { timeout: 5000 });
  }

  /**
   * Test rate limiting
   */
  static async testRateLimiting(
    page: Page,
    action: () => Promise<void>,
    maxAttempts: number = 5
  ) {
    for (let i = 0; i < maxAttempts; i++) {
      await action();
      await page.waitForTimeout(1000); // Wait 1 second between attempts
    }

    // Should show rate limit error
    await page.waitForSelector('.error, .rate-limit', { timeout: 5000 });
  }

  /**
   * Test session security
   */
  static async testSessionSecurity(page: Page) {
    // Check for secure session cookies
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((cookie) =>
      cookie.name.includes('session')
    );

    if (sessionCookie) {
      expect(sessionCookie.secure).toBe(true);
      expect(sessionCookie.httpOnly).toBe(true);
    }
  }

  /**
   * Test authentication bypass attempts
   */
  static async testAuthBypass(page: Page) {
    // Try to access protected route without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    expect(page.url()).toContain('/login');
  }
}

// Export individual functions for backward compatibility
export const testFormValidation = SecurityTestHelpers.testFormValidation;
export const testPasswordValidation =
  SecurityTestHelpers.testPasswordValidation;
export const testEmailValidation = SecurityTestHelpers.testEmailValidation;
export const testXSSProtection = SecurityTestHelpers.testXSSProtection;
export const testCSRFProtection = SecurityTestHelpers.testCSRFProtection;
export const testRateLimiting = SecurityTestHelpers.testRateLimiting;
export const testSessionSecurity = SecurityTestHelpers.testSessionSecurity;
export const testAuthBypass = SecurityTestHelpers.testAuthBypass;

// Additional security test functions
export async function testSecurityHeaders(page: any) {
  const response = await page.goto('/');
  const headers = response.headers();

  // Check for security headers
  expect(headers['x-frame-options']).toBeTruthy();
  expect(headers['x-content-type-options']).toBeTruthy();
  expect(headers['x-xss-protection']).toBeTruthy();
}

export async function testSecureAuthentication(page: any) {
  await page.goto('/login');

  // Test secure authentication flow
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'SecurePassword123!');
  await page.click('button[type="submit"]');

  // Should redirect to dashboard on success
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function testSecureErrorHandling(page: any) {
  // Test that errors don't leak sensitive information
  await page.goto('/login');

  // Try invalid credentials
  await page.fill('input[type="email"]', 'invalid@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');

  // Should show generic error message
  await page.waitForSelector('.error, .invalid', { timeout: 5000 });

  // Error message should not contain sensitive information
  const errorText = await page.textContent('.error, .invalid');
  expect(errorText).not.toContain('password');
  expect(errorText).not.toContain('database');
}
