// PWA Service Worker Registration
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  try {
    // Check if we're in development or production
    const isDev = import.meta.env.DEV;

    if (isDev) {
      // In development, check if we're in test mode
      const isTestMode = import.meta.env.MODE === 'test' || 
                        window.location.hostname.includes('localhost');
      
      if (!isTestMode) {
        console.log('PWA disabled in development mode for better performance');
        return;
      }
      
      console.log('PWA enabled in development mode for testing');
    }
    
    // Register service worker (both dev and prod)
    {
      // Use the built service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('SW registered: ', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, reload the page
              window.location.reload();
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

// Enhanced Service Worker Detection
export function isServiceWorkerRegistered(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return Promise.resolve(false); // Not available during SSR
  }

  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }

    // Check if service worker is already registered
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (registration) {
          resolve(true);
          return;
        }

        // If not registered, wait a bit and check again (for development mode)
        setTimeout(() => {
          navigator.serviceWorker
            .getRegistration()
            .then((reg) => {
              resolve(!!reg);
            })
            .catch(() => resolve(false));
        }, 2000);
      })
      .catch(() => resolve(false));
  });
}

// Check if service worker is controlling the page
export function isServiceWorkerControlling(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false; // Not available during SSR
  }
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
}

// Wait for service worker to be ready
export function waitForServiceWorkerReady(timeout = 10000): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return Promise.resolve(false); // Not available during SSR
  }

  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }

    const startTime = Date.now();

    const checkSW = () => {
      // Check if SW is registered and controlling
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration && navigator.serviceWorker.controller) {
            resolve(true);
            return;
          }

          // Check if we've exceeded timeout
          if (Date.now() - startTime > timeout) {
            resolve(false);
            return;
          }

          // Check again in 500ms
          setTimeout(checkSW, 500);
        })
        .catch(() => {
          if (Date.now() - startTime > timeout) {
            resolve(false);
          } else {
            setTimeout(checkSW, 500);
          }
        });
    };

    checkSW();
  });
}

// Offline Detection with real network test
export function isOnline(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true; // Default to online during SSR
  }
  
  // Start with navigator.onLine but don't trust it completely
  if (!navigator.onLine) {
    return false; // Definitely offline if browser says so
  }
  
  // If browser says online, assume online (avoid false positives)
  // The real network test will be done asynchronously
  return true;
}

export function addOnlineStatusListener(
  callback: (online: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op during SSR
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Add missing type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// PWA Installation Functions
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Allow PWA installation in production or test mode
  if (import.meta.env.DEV) {
    const isTestMode = import.meta.env.MODE === 'test' || 
                      (typeof window !== 'undefined' && window.location.hostname.includes('localhost'));
    return isTestMode;
  }

  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get the deferred install prompt from the global scope
function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check if the global function exists (set in app.html)
  if (typeof (window as any).getDeferredInstallPrompt === 'function') {
    return (window as any).getDeferredInstallPrompt();
  }
  
  return null;
}

// Clear the deferred install prompt
function clearDeferredInstallPrompt(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  if (typeof (window as any).clearDeferredInstallPrompt === 'function') {
    (window as any).clearDeferredInstallPrompt();
  }
}

export function getInstallPrompt(): Promise<BeforeInstallPromptEvent | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  // Allow install prompt in development for testing
  if (import.meta.env.DEV) {
    const isTestMode = import.meta.env.MODE === 'test' || 
                      (typeof window !== 'undefined' && window.location.hostname.includes('localhost'));
    if (!isTestMode) {
      return Promise.resolve(null);
    }
  }

  // Return the stored prompt if available
  return Promise.resolve(getDeferredInstallPrompt());
}

export async function installPWA(): Promise<boolean> {
  try {
    // Allow installation in development for testing
    if (import.meta.env.DEV) {
      const isTestMode = import.meta.env.MODE === 'test' || 
                        (typeof window !== 'undefined' && window.location.hostname.includes('localhost'));
      if (!isTestMode) {
        console.log('PWA installation not available in development mode');
        return false;
      }
    }

    const promptEvent = getDeferredInstallPrompt();
    if (!promptEvent) {
      console.log('No install prompt available');
      return false;
    }

    await promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;

    // Clear the stored prompt after use
    clearDeferredInstallPrompt();

    if (choiceResult.outcome === 'accepted') {
      console.log('PWA installed successfully');
      return true;
    } else {
      console.log('PWA installation dismissed');
      return false;
    }
  } catch (error) {
    console.error('PWA installation failed:', error);
    return false;
  }
}

// PWA Update Detection
export function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return Promise.resolve(false); // Not available during SSR
  }

  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update().then(() => {
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    } else {
      resolve(false);
    }
  });
}

// PWA initialization is handled by Vite PWA plugin
// Manual registration is not needed when using VitePWA plugin
