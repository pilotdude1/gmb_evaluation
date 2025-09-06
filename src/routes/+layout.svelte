<script lang="ts">
  import '../app.css';
  import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
  import PWAInstall from '$lib/components/PWAInstall.svelte';
  import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
  import PWAUpdateNotification from '$lib/components/PWAUpdateNotification.svelte';
  import { onMount } from 'svelte';
  import { registerServiceWorker } from '$lib/pwa';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  onMount(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();
  });
</script>

<svelte:head>
  <title>{data?.title || 'LocalSocialMax'}</title>
  <meta name="description" content={data?.description || 'A modern SaaS application with authentication and module management'} />
</svelte:head>

<div class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
  <div class="flex justify-end p-4">
    <ThemeSwitch />
  </div>
  <slot />
  
  <!-- PWA Components -->
  <PWAInstall />
  <!-- <OfflineIndicator /> Temporarily disabled due to false positives -->
  <PWAUpdateNotification />
</div> 