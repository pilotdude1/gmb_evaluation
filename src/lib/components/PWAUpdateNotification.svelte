<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let showUpdateNotification = false;
  let isUpdating = false;

  onMount(() => {
    if (browser && 'serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker has been updated
        showUpdateNotification = true;
      });

      // Check for updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification = true;
              }
            });
          }
        });
      });
    }
  });

  function updateApp() {
    isUpdating = true;
    if (browser && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  function dismissNotification() {
    showUpdateNotification = false;
  }

  // Test function - remove in production
  function testUpdateNotification() {
    showUpdateNotification = true;
  }
</script>

{#if showUpdateNotification}
  <div class="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          Update Available
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          A new version is available. Click update to get the latest features.
        </p>
      </div>
      <button
        type="button"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        on:click={dismissNotification}
        aria-label="Dismiss update notification"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div class="mt-3 flex space-x-2">
      <button
        type="button"
        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50"
        on:click={updateApp}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Update Now'}
      </button>
      <button
        type="button"
        class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors"
        on:click={dismissNotification}
      >
        Later
      </button>
    </div>
  </div>
{/if}

<!-- Test button removed -->
