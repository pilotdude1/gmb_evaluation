import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { URL } from 'url';

async function testPWA() {
  console.log('🚀 Starting PWA Testing...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Navigate to your app
    console.log('📱 Loading application...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

    // Wait for service worker to register
    await page.waitForTimeout(3000);

    // Test 1: Check if service worker is registered
    console.log('\n🔍 Test 1: Service Worker Registration');
    const swRegistered = await page.evaluate(() => {
      return (
        'serviceWorker' in navigator &&
        navigator.serviceWorker.controller !== null
      );
    });
    console.log(`✅ Service Worker Registered: ${swRegistered}`);

    // Test 2: Check if manifest is loaded
    console.log('\n📋 Test 2: Web App Manifest');
    const manifest = await page.evaluate(() => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      return manifestLink ? manifestLink.href : null;
    });
    console.log(`✅ Manifest Found: ${manifest ? 'Yes' : 'No'}`);

    // Test 3: Check PWA installability
    console.log('\n📲 Test 3: PWA Installability');
    const beforeInstallPrompt = await page.evaluate(() => {
      return new Promise((resolve) => {
        let promptFired = false;
        window.addEventListener('beforeinstallprompt', () => {
          promptFired = true;
        });
        setTimeout(() => resolve(promptFired), 2000);
      });
    });
    console.log(`✅ Install Prompt Available: ${beforeInstallPrompt}`);

    // Test 4: Check offline functionality
    console.log('\n📴 Test 4: Offline Functionality');
    await page.setOfflineMode(true);
    await page.reload({ waitUntil: 'networkidle0' });

    const offlineIndicator = await page.evaluate(() => {
      const indicator =
        document.querySelector('[data-offline-indicator]') ||
        document.querySelector('.offline-indicator') ||
        document.querySelector('[class*="offline"]');
      return indicator ? indicator.textContent : 'No offline indicator found';
    });
    console.log(`✅ Offline Indicator: ${offlineIndicator}`);

    // Test 5: Check theme color meta tags
    console.log('\n🎨 Test 5: Theme Color Meta Tags');
    const themeColors = await page.evaluate(() => {
      const lightTheme = document.querySelector(
        'meta[name="theme-color"][media*="light"]'
      );
      const darkTheme = document.querySelector(
        'meta[name="theme-color"][media*="dark"]'
      );
      return {
        light: lightTheme ? lightTheme.getAttribute('content') : null,
        dark: darkTheme ? darkTheme.getAttribute('content') : null,
      };
    });
    console.log(`✅ Light Theme Color: ${themeColors.light}`);
    console.log(`✅ Dark Theme Color: ${themeColors.dark}`);

    // Test 6: Check PWA icons
    console.log('\n🖼️ Test 6: PWA Icons');
    const icons = await page.evaluate(() => {
      const iconLinks = document.querySelectorAll(
        'link[rel="icon"], link[rel="apple-touch-icon"]'
      );
      return Array.from(iconLinks).map((link) => ({
        rel: link.getAttribute('rel'),
        href: link.getAttribute('href'),
        sizes: link.getAttribute('sizes'),
      }));
    });
    console.log(`✅ Icons Found: ${icons.length}`);
    icons.forEach((icon) => {
      console.log(`   - ${icon.rel}: ${icon.href} ${icon.sizes || ''}`);
    });

    console.log('\n✅ PWA Testing Complete!');
    console.log('\n📊 Next Steps:');
    console.log('1. Run Lighthouse audit in Chrome DevTools');
    console.log('2. Test on mobile device');
    console.log('3. Test installation on different browsers');
    console.log('4. Verify offline functionality with real network conditions');
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:4173');
    return response.ok;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Server not running on http://localhost:4173');
    console.log('💡 Please run: npm run build && npm run preview');
    process.exit(1);
  }

  await testPWA();
}

main().catch(console.error);
