/**
 * Cache and Storage Management Utility
 * Ensures the browser never stores or serves stale banner, product, or pricing data.
 */

export function purgeStaleCaches() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Clear any legacy/stale local & session storage keys that might store cached website content
    const staleKeyPrefixes = [
      'nangsal_banner',
      'nangsal_products',
      'nangsal_cache',
      'banner_',
      'products_cache',
      'site_content',
      'hero_banner',
      'product_data',
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && staleKeyPrefixes.some((prefix) => key.startsWith(prefix))) {
        console.log(`[CacheManager] Purged stale localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    }

    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && staleKeyPrefixes.some((prefix) => key.startsWith(prefix))) {
        console.log(`[CacheManager] Purged stale sessionStorage key: ${key}`);
        sessionStorage.removeItem(key);
      }
    }

    // 2. Invalidate CacheStorage (Service Worker caches) if any exist
    if ('caches' in window) {
      window.caches.keys().then((names) => {
        for (const name of names) {
          window.caches.delete(name);
          console.log(`[CacheManager] Deleted CacheStorage container: ${name}`);
        }
      }).catch((e) => console.warn('[CacheManager] CacheStorage cleanup skipped:', e));
    }

    // 3. Unregister any stale Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[CacheManager] Unregistered ServiceWorker:', registration);
        }
      }).catch((e) => console.warn('[CacheManager] ServiceWorker cleanup skipped:', e));
    }
  } catch (err) {
    console.warn('[CacheManager] Cache purge encountered non-fatal error:', err);
  }
}

/**
 * Hard reload and reset
 */
export function forceHardReload() {
  if (typeof window === 'undefined') return;
  purgeStaleCaches();
  window.location.reload();
}
