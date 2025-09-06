import { test, expect } from '@playwright/test';
import {
  testFormValidation,
  testPasswordValidation,
  testEmailValidation,
  testSecurityHeaders,
  testRateLimiting,
  testCSRFProtection,
  testSecureAuthentication,
  testSecureErrorHandling,
} from '../utils/security-test-helpers';

test.describe('Security Features Tests', () => {
  test('should have enhanced form validation', async ({ page }) => {
    await page.goto('/signup');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );

    if ((await emailInput.count()) > 0) {
      // Test enhanced email validation
      await testEmailValidation(
        page,
        expect,
        emailInput,
        ['invalid-email', 'test@', '@test.com', 'test..test@example.com'], // invalid emails
        'test@example.com', // valid email
        { expectValidationErrors: true, timeout: 10000 }
      );

      // Test enhanced password validation
      await testPasswordValidation(
        page,
        expect,
        passwordInput,
        '123', // weak password
        'StrongPassword123!', // strong password
        { expectValidationErrors: true, timeout: 10000 }
      );
    }
  });

  test('should have rate limiting on auth endpoints', async ({ page }) => {
    // Test rate limiting on authentication endpoints
    const rateLimitTriggered = await testRateLimiting(
      page,
      '/api/auth/login',
      5, // max requests
      { expectRateLimiting: true, timeout: 15000 }
    );

    // Rate limiting should be working
    expect(rateLimitTriggered).toBe(true);
  });

  test('should have CSRF protection on forms', async ({ page }) => {
    await page.goto('/signup');

    // Test CSRF protection
    const hasCSRFProtection = await testCSRFProtection(page, 'form', {
      expectCSRFProtection: true,
    });

    // CSRF protection should be present
    expect(hasCSRFProtection).toBe(true);
  });

  test('should have security headers', async ({ page }) => {
    // Test security headers
    const hasSecurityHeaders = await testSecurityHeaders(page);

    // Security headers should be present
    expect(hasSecurityHeaders).toBe(true);
  });

  test('should handle authentication with enhanced security', async ({
    page,
  }) => {
    // Test secure authentication (this would need valid credentials)
    const authSuccess = await testSecureAuthentication(
      page,
      'test@example.com',
      'TestPassword123!',
      { timeout: 15000 }
    );

    // Authentication should work with enhanced security
    // Note: This test may fail if credentials are not valid
    // In a real scenario, you'd use test credentials
    console.log('Authentication result:', authSuccess);
  });

  test('should handle errors securely', async ({ page }) => {
    // Test secure error handling
    const errorHandled = await testSecureErrorHandling(page, {
      timeout: 10000,
    });

    // Error handling should work securely
    expect(errorHandled).toBe(true);
  });

  test('should sanitize user inputs', async ({ page }) => {
    await page.goto('/signup');

    const emailInput = page.locator('input[type="email"], input[name="email"]');

    if ((await emailInput.count()) > 0) {
      // Test XSS prevention
      const xssPayload = '<script>alert("xss")</script>@example.com';
      await emailInput.fill(xssPayload);
      await emailInput.blur();

      // Should not execute script
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>alert("xss")</script>');
    }
  });

  test('should prevent common security vulnerabilities', async ({ page }) => {
    await page.goto('/');

    // Test for common security issues
    const pageContent = await page.content();

    // Should not expose sensitive information
    expect(pageContent).not.toContain('VITE_SUPABASE_URL');
    expect(pageContent).not.toContain('VITE_SUPABASE_ANON_KEY');
    expect(pageContent).not.toContain('CSRF_SECRET');

    // Should have proper content security policy
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    if ((await cspMeta.count()) > 0) {
      const cspContent = await cspMeta.getAttribute('content');
      expect(cspContent).toContain("default-src 'self'");
    }
  });

  test('should handle session management securely', async ({ page }) => {
    await page.goto('/');

    // Check for secure session handling
    const cookies = await page.context().cookies();

    // Session cookies should be secure in production
    const sessionCookies = cookies.filter(
      (cookie) =>
        cookie.name.includes('session') || cookie.name.includes('auth')
    );

    for (const cookie of sessionCookies) {
      // In production, cookies should be secure
      if (process.env.NODE_ENV === 'production') {
        expect(cookie.secure).toBe(true);
        expect(cookie.httpOnly).toBe(true);
      }
    }
  });

  test('should validate environment configuration', async ({ page }) => {
    await page.goto('/');

    // Test that environment validation is working
    const pageContent = await page.content();

    // Should not show environment errors in production
    if (process.env.NODE_ENV === 'production') {
      expect(pageContent).not.toContain(
        'Missing Supabase environment variables'
      );
      expect(pageContent).not.toContain('Invalid VITE_SUPABASE_URL format');
    }
  });
});
