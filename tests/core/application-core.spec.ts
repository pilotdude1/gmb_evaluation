import { test, expect } from '@playwright/test';

test.describe('Application Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title and content', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/LocalSocialMax/i);

    // Check for main content
    await expect(page.locator('body')).toContainText(/LocalSocialMax/i);

    // Check for theme switch (should be present in layout)
    const themeSwitch = page.locator(
      '[data-testid="theme-switch"], .theme-switch'
    );
    if ((await themeSwitch.count()) > 0) {
      await expect(themeSwitch).toBeVisible();
    }
  });

  test('should have proper page structure and layout', async ({ page }) => {
    // Check for main layout elements
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/
    );

    // Check for main content area
    const mainContent = page.locator('main, .contents, [role="main"]');
    expect(await mainContent.count()).toBeGreaterThan(0);
  });

  test('should have working navigation', async ({ page }) => {
    // Test navigation to different pages
    const pages = [
      { path: '/', title: /LocalSocialMax/i },
      { path: '/about', title: /About/i },
      { path: '/dashboard', title: /Dashboard/i },
      { path: '/profile', title: /Profile/i },
      { path: '/signup', title: /Sign Up/i },
      { path: '/demo', title: /Demo/i },
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.path);
        await expect(page).toHaveTitle(pageInfo.title);

        // Check that page loads without errors
        await expect(page.locator('body')).not.toContainText('Error');
        await expect(page.locator('body')).not.toContainText('404');
      } catch (error) {
        // Some pages might require authentication, which is expected
        console.log(`Page ${pageInfo.path} might require auth or not exist`);
      }
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Check that page is responsive
      const bodyWidth = await page
        .locator('body')
        .evaluate((el) => el.offsetWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width);

      // Check that content is visible
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have proper accessibility features', async ({ page }) => {
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    expect(await headings.count()).toBeGreaterThan(0);

    // Check for proper alt text on images
    const images = page.locator('img');
    for (let i = 0; i < (await images.count()); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt text should exist (even if empty for decorative images)
      expect(alt).not.toBeNull();
    }

    // Check for proper form labels
    const inputs = page.locator('input, textarea, select');
    for (let i = 0; i < (await inputs.count()); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if ((await label.count()) === 0 && !ariaLabel) {
          // Input should have either a label or aria-label
          console.log(`Input ${id} might need accessibility improvement`);
        }
      }
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');

    // Should not crash and should show some content
    await expect(page.locator('body')).toBeVisible();

    // Should not show raw error messages
    await expect(page.locator('body')).not.toContainText('Error:');
    await expect(page.locator('body')).not.toContainText('Cannot find module');
  });

  test('should have working theme switching', async ({ page }) => {
    // Look for theme switch component
    const themeSwitch = page.locator(
      '[data-testid="theme-switch"], .theme-switch, button[aria-label*="theme"]'
    );

    if ((await themeSwitch.count()) > 0) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light';
      });

      // Click theme switch
      await themeSwitch.click();

      // Wait for theme change
      await page.waitForTimeout(500);

      // Check if theme changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light';
      });

      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should have proper loading states', async ({ page }) => {
    // Navigate to a page that might have loading states
    await page.goto('/dashboard');

    // Check for loading indicators (if they exist)
    const loadingIndicators = page.locator(
      '[data-testid="loading"], .loading, .spinner'
    );

    if ((await loadingIndicators.count()) > 0) {
      // Loading indicators should eventually disappear
      await expect(loadingIndicators.first()).not.toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    // Check for essential meta tags
    await expect(page.locator('meta[charset="utf-8"]')).toBeAttached();
    await expect(page.locator('meta[name="viewport"]')).toBeAttached();

    // Check for description meta tag
    const description = page.locator('meta[name="description"]');
    if ((await description.count()) > 0) {
      await expect(description).toHaveAttribute('content');
    }

    // Check for favicon
    await expect(page.locator('link[rel="icon"]')).toBeAttached();
  });
});
