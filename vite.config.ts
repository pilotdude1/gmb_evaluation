import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [
      sveltekit(),
      // Enable PWA in both development and production for testing
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        selfDestroying: false,
        includeManifestIcons: false,
        injectManifest: false,
        devOptions: {
          enabled: true, // Enable PWA in development for testing
          type: 'module',
        },
        manifest: {
          name: 'LocalSocialMax',
          short_name: 'LSM',
          description:
            'A modern SaaS application with authentication and module management',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['productivity', 'business', 'utilities'],
          lang: 'en',
          dir: 'ltr',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-256x256.png',
              sizes: '256x256',
              type: 'image/png',
            },
            {
              src: 'pwa-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: 'screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Desktop view of LocalSocialMax',
            },
            {
              src: 'screenshot-mobile.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Mobile view of LocalSocialMax',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          runtimeCaching: [
            {
              urlPattern:
                /^https:\/\/.*\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-assets',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\/api\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.(woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        },
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'masked-icon.svg',
        ],
      }),
    ],
    optimizeDeps: {
      exclude: ['@supabase/supabase-js', 'sharp'],
      include: ['@supabase/supabase-js'],
    },
    server: {
      fs: {
        // Allow serving files from dev-dist directory
        allow: ['..', 'dev-dist'],
      },
      // Add cache-busting headers for development
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
    preview: {
      // Add cache-busting headers for preview mode
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  };
});
