# PWA Troubleshooting Guide

## 🎯 Overview

This guide helps you fix PWA (Progressive Web App) issues that may cause test failures in the comprehensive testing suite.

## 🔍 Common PWA Issues

### 1. **Manifest File Not Found**
**Symptoms:** Tests fail with "manifest check failed" errors
**Solution:** Ensure `static/manifest.webmanifest` exists and is accessible

### 2. **Service Worker Not Registering**
**Symptoms:** Service worker tests fail or timeout
**Solution:** Check service worker registration and browser support

### 3. **PWA Icons Missing**
**Symptoms:** Icon tests fail
**Solution:** Verify all PWA icon files exist in the static directory

### 4. **Offline Page Not Accessible**
**Symptoms:** Offline functionality tests fail
**Solution:** Ensure `static/offline.html` exists and is properly configured

## 🛠️ Quick Fixes

### Step 1: Verify PWA Files Exist

Check that these files exist in your `static/` directory:

```bash
ls -la static/
```

Required files:
- ✅ `manifest.webmanifest`
- ✅ `offline.html`
- ✅ `pwa-192x192.png`
- ✅ `pwa-256x256.png`
- ✅ `pwa-384x384.png`
- ✅ `pwa-512x512.png`
- ✅ `apple-touch-icon.png`
- ✅ `registerSW.js`
- ✅ `sw.js`

### Step 2: Test PWA Setup

Run the PWA setup test:

```bash
npm run test:pwa-setup
```

This will check if all PWA files are accessible via HTTP.

### Step 3: Verify Vite Configuration

Ensure your `vite.config.ts` has PWA enabled:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true, // Enable PWA in development for testing
        type: 'module',
      },
      // ... rest of PWA config
    }),
  ],
});
```

### Step 4: Check HTML Head

Verify your `src/app.html` has proper PWA meta tags:

```html
<!-- PWA Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="LocalSocialMax" />
<meta name="mobile-web-app-capable" content="yes" />

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.webmanifest" />

<!-- Service Worker Registration -->
<script type="module" src="/registerSW.js"></script>
```

## 🧪 Testing PWA Functionality

### Manual Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser developer tools:**
   - Go to Application tab
   - Check Manifest section
   - Check Service Workers section

3. **Test PWA features:**
   - Install the app (should show install prompt)
   - Test offline functionality
   - Check if service worker is registered

### Automated Testing

Run the comprehensive test suite:

```bash
npm run test:comprehensive
```

Or run specific PWA tests:

```bash
npm run test tests/comprehensive-e2e-suite.spec.ts --grep "PWA"
```

## 🔧 Advanced Fixes

### Fix 1: Service Worker Registration Issues

If service worker registration fails, check:

1. **Browser Support:**
   ```javascript
   if ('serviceWorker' in navigator) {
     // Service worker is supported
   }
   ```

2. **HTTPS Requirement:**
   - Service workers require HTTPS in production
   - Localhost is allowed for development

3. **Registration Script:**
   Ensure `static/registerSW.js` exists and is properly referenced.

### Fix 2: Manifest Issues

If manifest is not loading:

1. **Check Content-Type:**
   The manifest should be served with `application/manifest+json` content type.

2. **Validate JSON:**
   Use a JSON validator to ensure `manifest.webmanifest` is valid.

3. **Check Path:**
   Ensure the manifest path in `app.html` is correct.

### Fix 3: Icon Issues

If PWA icons are not loading:

1. **Verify File Sizes:**
   - 192x192: ~19KB
   - 256x256: ~25KB
   - 384x384: ~42KB
   - 512x512: ~33KB

2. **Check Image Format:**
   Ensure all icons are valid PNG files.

3. **Verify Paths:**
   Check that icon paths in manifest match actual file locations.

## 🚨 Emergency Fixes

### Quick PWA Disable (for testing only)

If PWA issues are blocking other tests, temporarily disable PWA:

1. **Comment out PWA plugin in vite.config.ts:**
   ```typescript
   // VitePWA({ ... }),
   ```

2. **Update test expectations:**
   Modify test helpers to be more lenient with PWA checks.

3. **Run tests without PWA:**
   ```bash
   npm run test -- --grep-invert "PWA"
   ```

### Minimal PWA Setup

For basic PWA functionality, ensure these files exist:

1. **Basic manifest:**
   ```json
   {
     "name": "LocalSocialMax",
     "short_name": "LSM",
     "start_url": "/",
     "display": "standalone",
     "icons": [
       {
         "src": "pwa-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Simple service worker:**
   ```javascript
   // Basic caching
   self.addEventListener('install', (event) => {
     event.waitUntil(caches.open('v1'));
   });
   ```

## 📊 PWA Health Check

Run this command to check PWA health:

```bash
npm run test:pwa-setup
```

Expected output:
```
🧪 Testing PWA Setup...
Testing against: http://localhost:5173

✅ /manifest.webmanifest - 200
✅ /offline.html - 200
✅ /pwa-192x192.png - 200
✅ /pwa-512x512.png - 200
✅ /apple-touch-icon.png - 200
✅ /registerSW.js - 200
✅ /sw.js - 200

📊 Results Summary:
Success: 7/7 (100%)
🎉 PWA setup looks good!
```

## 🔄 Troubleshooting Workflow

1. **Identify the Issue:**
   - Run `npm run test:pwa-setup`
   - Check which files are failing

2. **Fix Missing Files:**
   - Create missing files
   - Verify file permissions

3. **Test Configuration:**
   - Check vite.config.ts
   - Verify app.html meta tags

4. **Run Tests:**
   - Test PWA setup again
   - Run comprehensive test suite

5. **Verify in Browser:**
   - Open developer tools
   - Check Application tab
   - Test PWA features manually

## 📚 Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Note:** PWA functionality requires HTTPS in production. For local development, localhost is allowed without HTTPS.
