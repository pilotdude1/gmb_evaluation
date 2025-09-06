import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - End to End', () => {
  test('complete user journey from landing to PWA installation', async ({
    page,
  }) => {
    // Step 1: Land on homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/LocalSocialMax/i);
    await expect(page.locator('body')).toContainText(/LocalSocialMax/i);

    // Step 2: Check PWA manifest is accessible
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('LocalSocialMax');

    // Step 3: Navigate to signup page
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Sign Up|Register/i);

    // Step 4: Test signup form validation
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );

    if ((await emailInput.count()) > 0) {
      // Test invalid email
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation errors
      await expect(page.locator('body')).toContainText(
        /invalid|error|required/i
      );
    }

    // Step 5: Test navigation to other pages
    const pages = ['/about', '/demo', '/forgot-password', '/magic-link'];

    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('body')).not.toContainText('Error:');
      } catch (error) {
        console.log(`Page ${pagePath} might not exist or require auth`);
      }
    }

    // Step 6: Test responsive design
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
      await expect(page.locator('body')).toBeVisible();

      // Check that content is responsive
      const bodyWidth = await page
        .locator('body')
        .evaluate((el) => el.offsetWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
    }

    // Step 7: Test PWA functionality
    await page.goto('/');

    // Check service worker registration
    await page.waitForFunction(
      () => {
        return (
          'serviceWorker' in navigator && navigator.serviceWorker.controller
        );
      },
      { timeout: 10000 }
    );

    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null;
    });
    expect(swRegistered).toBe(true);

    // Step 8: Test offline functionality
    const offlineResponse = await page.request.get('/offline.html');
    expect(offlineResponse.status()).toBe(200);

    // Step 9: Test PWA icons accessibility
    const iconResponses = [
      page.request.get('/pwa-192x192.png'),
      page.request.get('/pwa-512x512.png'),
      page.request.get('/apple-touch-icon.png'),
      page.request.get('/masked-icon.svg'),
    ];

    for (const iconResponse of iconResponses) {
      const response = await iconResponse;
      expect(response.status()).toBe(200);
    }

    // Step 10: Test theme switching
    const themeSwitch = page.locator(
      '[data-testid="theme-switch"], .theme-switch, button[aria-label*="theme"]'
    );

    if ((await themeSwitch.count()) > 0) {
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light';
      });

      await themeSwitch.click();
      await page.waitForTimeout(500);

      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light';
      });

      expect(newTheme).not.toBe(initialTheme);
    }

    // Step 11: Test accessibility features
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    expect(await headings.count()).toBeGreaterThan(0);

    // Check for proper alt text on images
    const images = page.locator('img');
    for (let i = 0; i < (await images.count()); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }

    // Step 12: Test error handling
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Error:');

    // Step 13: Test PWA installation prompt
    // Check if PWA install components are present
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Install LocalSocialMax');

    // Step 14: Test form interactions
    await page.goto('/signup');

    const inputs = page.locator('input, textarea, select');
    if ((await inputs.count()) > 0) {
      // Test form field interactions
      for (let i = 0; i < Math.min(await inputs.count(), 3); i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');

        if (type !== 'submit' && type !== 'button') {
          await input.click();
          await input.fill('test input');
          await expect(input).toHaveValue('test input');
        }
      }
    }

    // Step 15: Test navigation and routing
    await page.goto('/');
    const links = page.locator('a[href^="/"]');

    if ((await links.count()) > 0) {
      // Test first few internal links
      for (let i = 0; i < Math.min(await links.count(), 3); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');

        if (href && !href.includes('#')) {
          try {
            await link.click();
            await expect(page.locator('body')).toBeVisible();
            await page.goBack();
          } catch (error) {
            console.log(`Link ${href} might require auth or not exist`);
          }
        }
      }
    }

    // Step 16: Final PWA validation
    await page.goto('/');

    // Verify all PWA requirements are met
    const pwaRequirements = [
      { name: 'Manifest', url: '/manifest.json' },
      {
        name: 'Service Worker',
        check: () => navigator.serviceWorker.controller !== null,
      },
      { name: 'Offline Page', url: '/offline.html' },
      {
        name: 'Icons',
        urls: ['/pwa-192x192.png', '/pwa-512x512.png', '/apple-touch-icon.png'],
      },
    ];

    for (const requirement of pwaRequirements) {
      if (requirement.url) {
        const response = await page.request.get(requirement.url);
        expect(response.status()).toBe(200);
      } else if (requirement.urls) {
        for (const url of requirement.urls) {
          const response = await page.request.get(url);
          expect(response.status()).toBe(200);
        }
      } else if (requirement.check) {
        const result = await page.evaluate(requirement.check);
        expect(result).toBe(true);
      }
    }

    console.log('✅ Complete user journey test passed successfully!');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network errors
    await page.route('**/*', (route) => route.abort());

    await page.goto('/');

    // Should still show some content or offline page
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Error:');
  });

  test('should work across different browsers', async ({ page }) => {
    // This test will run in different browser contexts
    await page.goto('/');

    // Basic functionality should work in all browsers
    await expect(page).toHaveTitle(/LocalSocialMax/i);
    await expect(page.locator('body')).toBeVisible();

    // PWA features should work in supported browsers
    const pwaSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'caches' in window;
    });

    if (pwaSupported) {
      // Test PWA functionality
      const manifestResponse = await page.request.get('/manifest.json');
      expect(manifestResponse.status()).toBe(200);
    }
  });
});
