/**
 * CDN utilities for automatic dependency loading
 */

// Extend Window interface to include shaka
declare global {
  interface Window {
    shaka?: any;
  }
}

interface CDNResource {
  url: string;
  integrity?: string;
  crossorigin?: string;
}

const CDN_RESOURCES = {
  shaka: {
    url: 'https://cdn.jsdelivr.net/npm/shaka-player@4.11.17/dist/shaka-player.compiled.min.js',
    integrity: 'sha384-...', // Would need actual integrity hash
  },
  codemirror: {
    js: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.js',
    css: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.css',
  },
};

/**
 * Check if a script is already loaded
 */
function isScriptLoaded(src: string): boolean {
  const scripts = document.querySelectorAll('script[src]');
  return Array.from(scripts).some(script =>
    (script as HTMLScriptElement).src.includes(src.split('/').pop() || '')
  );
}

// isStylesheetLoaded function removed - not currently used

/**
 * Load a script dynamically
 */
function loadScript(resource: CDNResource): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded(resource.url)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = resource.url;
    script.async = true;

    if (resource.integrity) {
      script.integrity = resource.integrity;
    }

    if (resource.crossorigin) {
      script.crossOrigin = resource.crossorigin;
    }

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${resource.url}`));

    document.head.appendChild(script);
  });
}

// loadStylesheet function removed - not currently used

/**
 * Auto-load required dependencies
 */
export async function autoLoadDependencies(): Promise<void> {
  const promises: Promise<void>[] = [];

  // Load Shaka Player if not already loaded
  if (typeof window.shaka === 'undefined') {
    promises.push(loadScript(CDN_RESOURCES.shaka));
  }

  // Wait for all dependencies to load
  await Promise.all(promises);

  // Install Shaka polyfills after loading
  if (typeof window.shaka !== 'undefined' && window.shaka.polyfill) {
    window.shaka.polyfill.installAll();
  }
}

/**
 * Check if all required dependencies are available
 */
export function checkDependencies(): { available: boolean; missing: string[] } {
  const missing: string[] = [];

  if (typeof window.shaka === 'undefined') {
    missing.push('shaka-player');
  }

  return {
    available: missing.length === 0,
    missing,
  };
}
