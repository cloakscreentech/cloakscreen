/**
 * Utility exports - standardized barrel pattern
 */

// Core utilities
export { default as EventEmitter } from './EventEmitter';
export { detectBrowserCapabilities } from './browser';
export { validateConfig, isValidElement, sanitizeConfigForLogging } from './validation';
export { getDRMCredentials } from './env';
export { detectHardwareAcceleration } from './hardware-acceleration';
export { initializeTamperProtection } from './tamper-detection';
export { logger, createLogger, coreLogger, drmLogger, providerLogger } from './logger';
export { deprecate, clearDeprecationWarnings } from './deprecation';
export {
  isEMESupported,
  KeySystem,
  SecurityLevel,
  isKeySystemSupported,
  getSupportedKeySystems,
  getEMESupport,
  createEMEConfig,
} from './eme';

// Enhanced DRM detection
export {
  detectOptimalDRM,
  detectDRMType,
  isDRMTypeSupported,
  DRMDetectionResult,
  DRMType,
  BrowserInfo,
  PlatformInfo,
  SecurityCapabilities,
} from './drm-detection';

// Internal helper functions (not exported to reduce bundle size)
// These are available for internal use but not part of public API

/**
 * Internal debounce utility - not exported to reduce bundle size
 * @internal
 */
function debounce(func: Function, wait: number): Function {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Internal throttle utility - not exported to reduce bundle size
 * @internal
 */
function throttle(func: Function, limit: number): Function {
  let inThrottle: boolean;
  return function executedFunction(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Internal ID generator - not exported to reduce bundle size
 * @internal
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Internal viewport checker - not exported to reduce bundle size
 * @internal
 */
function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Export internal utilities for use within the library
export const internalUtils = {
  debounce,
  throttle,
  generateId,
  isElementInViewport,
};
