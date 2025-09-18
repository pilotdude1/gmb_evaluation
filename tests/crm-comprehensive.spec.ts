import { test, expect } from '@playwright/test';

/**
 * Comprehensive CRM Test Suite
 * Tests all CRM functionality to identify issues upfront
 */

test.describe('CRM Comprehensive Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test.describe('Authentication & User Setup', () => {
    test('should handle user registration and profile creation', async ({ page }) => {
      console.log('Testing user registration flow...');
      
      // Test authentication
      await test.step('Navigate to auth', async () => {
        // Check if there's a login/signup form or if we're already logged in
        const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")');
        const signupButton = page.locator('button:has-text("Sign Up"), button:has-text("Register"), a:has-text("Sign Up")');
        const crmLink = page.locator('a:has-text("CRM"), [href*="crm"]');
        
        if (await crmLink.isVisible()) {
          console.log('User appears to be logged in, testing CRM access...');
        } else if (await loginButton.isVisible() || await signupButton.isVisible()) {
          console.log('Auth forms detected, but we need actual credentials for testing');
          // For now, we'll skip auth and focus on CRM functionality
          // In a real test, you'd use test credentials
        }
      });

      // Try to access CRM directly to see what happens
      await test.step('Access CRM without auth', async () => {
        await page.goto('/crm');
        
        // Check if we're redirected to auth or if we can access CRM
        await page.waitForLoadState('networkidle');
        const url = page.url();
        console.log('CRM access resulted in URL:', url);
        
        // Take screenshot for manual verification
        await page.screenshot({ path: 'test-results/crm-access-check.png', fullPage: true });
      });
    });

    test('should test user profile and tenant setup', async ({ page }) => {
      console.log('Testing user profile and tenant setup...');
      
      // Navigate to CRM
      await page.goto('/crm');
      await page.waitForLoadState('networkidle');
      
      // Check for error messages or auth requirements
      const errorMessages = await page.locator('[class*="error"], [class*="alert"], .bg-red-').allTextContents();
      if (errorMessages.length > 0) {
        console.log('Detected error messages:', errorMessages);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/crm-dashboard-state.png', fullPage: true });
    });
  });

  test.describe('CRM Navigation & Routes', () => {
    test('should test all CRM routes accessibility', async ({ page }) => {
      const routes = [
        '/crm',
        '/crm/accounts',
        '/crm/accounts/new',
        '/crm/contacts',
        '/crm/contacts/new',
        '/crm/deals',
        '/crm/deals/new'
      ];

      for (const route of routes) {
        await test.step(`Test route: ${route}`, async () => {
          console.log(`Testing route: ${route}`);
          
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          
          // Check for errors
          const hasError = await page.locator('[class*="error"], [class*="alert"], .bg-red-').count() > 0;
          const title = await page.title();
          const url = page.url();
          
          console.log(`Route ${route}:`, {
            finalUrl: url,
            title: title,
            hasError: hasError
          });
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/route-${route.replace(/\//g, '-')}.png`, 
            fullPage: true 
          });
        });
      }
    });

    test('should test CRM navigation links', async ({ page }) => {
      await page.goto('/crm');
      await page.waitForLoadState('networkidle');
      
      // Test navigation links
      const navLinks = [
        'Dashboard',
        'Accounts', 
        'Contacts',
        'Deals'
      ];

      for (const linkText of navLinks) {
        await test.step(`Test navigation: ${linkText}`, async () => {
          const link = page.locator(`a:has-text("${linkText}"), button:has-text("${linkText}")`);
          
          if (await link.isVisible()) {
            console.log(`Clicking navigation: ${linkText}`);
            await link.click();
            await page.waitForLoadState('networkidle');
            
            const url = page.url();
            console.log(`Navigation to ${linkText} resulted in URL: ${url}`);
            
            // Check for errors
            const errorCount = await page.locator('[class*="error"], [class*="alert"], .bg-red-').count();
            if (errorCount > 0) {
              const errors = await page.locator('[class*="error"], [class*="alert"], .bg-red-').allTextContents();
              console.log(`Errors on ${linkText}:`, errors);
            }
          } else {
            console.log(`Navigation link "${linkText}" not found`);
          }
        });
      }
    });
  });

  test.describe('Quick Actions Testing', () => {
    test('should test all Quick Action buttons', async ({ page }) => {
      await page.goto('/crm');
      await page.waitForLoadState('networkidle');
      
      // Find and test Quick Actions
      const quickActionButtons = [
        'Add New Account',
        'Add New Contact', 
        'Create New Deal'
      ];

      for (const buttonText of quickActionButtons) {
        await test.step(`Test Quick Action: ${buttonText}`, async () => {
          console.log(`Testing Quick Action: ${buttonText}`);
          
          const button = page.locator(`button:has-text("${buttonText}"), a:has-text("${buttonText}")`);
          
          if (await button.isVisible()) {
            await button.click();
            await page.waitForLoadState('networkidle');
            
            const url = page.url();
            const title = await page.title();
            
            console.log(`Quick Action "${buttonText}":`, {
              finalUrl: url,
              title: title
            });
            
            // Check for errors
            const errorCount = await page.locator('[class*="error"], [class*="alert"], .bg-red-').count();
            if (errorCount > 0) {
              const errors = await page.locator('[class*="error"], [class*="alert"], .bg-red-').allTextContents();
              console.log(`Errors for ${buttonText}:`, errors);
            }
            
            // Take screenshot
            await page.screenshot({ 
              path: `test-results/quick-action-${buttonText.toLowerCase().replace(/\s+/g, '-')}.png`, 
              fullPage: true 
            });
            
            // Go back to dashboard for next test
            await page.goto('/crm');
            await page.waitForLoadState('networkidle');
          } else {
            console.log(`Quick Action button "${buttonText}" not found`);
          }
        });
      }
    });
  });

  test.describe('Account Creation Flow', () => {
    test('should test complete account creation process', async ({ page }) => {
      console.log('Testing complete account creation flow...');
      
      await test.step('Navigate to Account Creation', async () => {
        await page.goto('/crm/accounts/new');
        await page.waitForLoadState('networkidle');
        
        // Take initial screenshot
        await page.screenshot({ path: 'test-results/account-creation-form.png', fullPage: true });
      });

      await test.step('Fill Account Form', async () => {
        // Check if form fields exist
        const nameField = page.locator('input[id="name"], input[name="name"]');
        const emailField = page.locator('input[id="email"], input[name="email"]');
        const websiteField = page.locator('input[id="website"], input[name="website"]');
        
        if (await nameField.isVisible()) {
          await nameField.fill('Test Company Inc.');
          console.log('Filled company name');
        }
        
        if (await emailField.isVisible()) {
          await emailField.fill('test@testcompany.com');
          console.log('Filled email');
        }
        
        if (await websiteField.isVisible()) {
          await websiteField.fill('https://testcompany.com');
          console.log('Filled website');
        }
        
        // Take screenshot after filling
        await page.screenshot({ path: 'test-results/account-form-filled.png', fullPage: true });
      });

      await test.step('Submit Account Form', async () => {
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
        
        if (await submitButton.isVisible()) {
          console.log('Clicking submit button...');
          
          // Listen for console logs to capture errors
          page.on('console', msg => {
            if (msg.type() === 'error') {
              console.log('Browser console error:', msg.text());
            }
            if (msg.text().includes('Error')) {
              console.log('Browser log:', msg.text());
            }
          });
          
          await submitButton.click();
          
          // Wait for response
          await page.waitForTimeout(3000);
          await page.waitForLoadState('networkidle');
          
          // Check for success or error messages
          const errorMessages = await page.locator('[class*="error"], [class*="alert"], .bg-red-').allTextContents();
          const successMessages = await page.locator('[class*="success"], .bg-green-').allTextContents();
          
          console.log('After submission:');
          console.log('Error messages:', errorMessages);
          console.log('Success messages:', successMessages);
          console.log('Final URL:', page.url());
          
          // Take final screenshot
          await page.screenshot({ path: 'test-results/account-creation-result.png', fullPage: true });
        } else {
          console.log('Submit button not found');
        }
      });
    });

    test('should test account creation error scenarios', async ({ page }) => {
      console.log('Testing account creation error scenarios...');
      
      await test.step('Submit empty form', async () => {
        await page.goto('/crm/accounts/new');
        await page.waitForLoadState('networkidle');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Check for validation errors
          const validationErrors = await page.locator('[class*="error"], .text-red-').allTextContents();
          console.log('Validation errors for empty form:', validationErrors);
          
          await page.screenshot({ path: 'test-results/account-creation-validation.png', fullPage: true });
        }
      });
    });
  });

  test.describe('Database & Backend Integration', () => {
    test('should test database connectivity and errors', async ({ page }) => {
      console.log('Testing database connectivity...');
      
      // Test different pages that require database access
      const dbTestPages = [
        { path: '/crm', description: 'Dashboard with stats' },
        { path: '/crm/accounts', description: 'Accounts listing' },
        { path: '/crm/accounts/new', description: 'Account creation form' }
      ];
      
      for (const testPage of dbTestPages) {
        await test.step(`Test DB on ${testPage.description}`, async () => {
          console.log(`Testing database access on: ${testPage.description}`);
          
          // Listen for network errors
          page.on('response', response => {
            if (response.status() >= 400) {
              console.log(`HTTP ${response.status()} error on ${response.url()}`);
            }
          });
          
          await page.goto(testPage.path);
          await page.waitForLoadState('networkidle');
          
          // Check for connection errors
          const hasConnectionError = await page.getByText(/connection|network|timeout|500|502|503/i).count() > 0;
          const hasAuthError = await page.getByText(/unauthorized|forbidden|login|sign in/i).count() > 0;
          const hasDbError = await page.getByText(/database|sql|query|constraint/i).count() > 0;
          
          console.log(`${testPage.description}:`, {
            connectionError: hasConnectionError,
            authError: hasAuthError,
            dbError: hasDbError
          });
          
          await page.screenshot({ 
            path: `test-results/db-test-${testPage.path.replace(/\//g, '-')}.png`, 
            fullPage: true 
          });
        });
      }
    });
  });

  test.describe('Performance & Loading', () => {
    test('should test page load performance', async ({ page }) => {
      const routes = ['/crm', '/crm/accounts', '/crm/accounts/new'];
      
      for (const route of routes) {
        await test.step(`Performance test: ${route}`, async () => {
          const startTime = Date.now();
          
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          
          const loadTime = Date.now() - startTime;
          console.log(`${route} load time: ${loadTime}ms`);
          
          // Check for loading states
          const hasLoader = await page.locator('[class*="loading"], [class*="spinner"], .animate-spin').count() > 0;
          console.log(`${route} has loading indicator: ${hasLoader}`);
        });
      }
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should test various error scenarios', async ({ page }) => {
      const errorScenarios = [
        { path: '/crm/nonexistent', description: '404 handling' },
        { path: '/crm/accounts/invalid-id', description: 'Invalid resource ID' }
      ];
      
      for (const scenario of errorScenarios) {
        await test.step(`Test ${scenario.description}`, async () => {
          console.log(`Testing: ${scenario.description}`);
          
          await page.goto(scenario.path);
          await page.waitForLoadState('networkidle');
          
          const url = page.url();
          const title = await page.title();
          
          console.log(`${scenario.description}:`, { finalUrl: url, title });
          
          await page.screenshot({ 
            path: `test-results/error-${scenario.description.replace(/\s+/g, '-')}.png`, 
            fullPage: true 
          });
        });
      }
    });
  });
});

// Helper test to generate a comprehensive report
test('Generate comprehensive test report', async ({ page }) => {
  console.log('\n=== COMPREHENSIVE CRM TEST REPORT ===');
  console.log('Check test-results/ directory for screenshots of all tested scenarios');
  console.log('Review console output above for detailed error messages and findings');
  console.log('=====================================\n');
  
  // Create a simple HTML report page
  await page.setContent(`
    <html>
      <head><title>CRM Test Report</title></head>
      <body>
        <h1>CRM Comprehensive Test Report</h1>
        <p>Test completed at: ${new Date().toISOString()}</p>
        <p>Check the test-results directory for detailed screenshots</p>
        <p>Review the console output for specific error messages and findings</p>
      </body>
    </html>
  `);
  
  await page.screenshot({ path: 'test-results/test-report.png', fullPage: true });
});
