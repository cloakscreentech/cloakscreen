/**
 * Auto-setup utilities for simple content protection
 */

import { coreLogger } from './logger';

/**
 * Simple configuration options for auto-protection
 */
export interface AutoProtectionConfig {
  /** Protection provider to use */
  provider?: 'demo' | 'cloud' | 'self-hosted';
  /** API key for cloud provider */
  apiKey?: string;
  /** Site ID for self-hosted */
  siteId?: string;
  /** Token endpoint for self-hosted */
  tokenEndpoint?: string;
  /** Fallback behavior */
  fallback?: 'blur' | 'hide' | 'placeholder';
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Find content that should be protected based on data attributes and classes
 */
export function findProtectedContent(): HTMLElement[] {
  // SSR safety check
  if (typeof document === 'undefined') {
    return [];
  }

  const selectors = ['[data-cloakscreen]', '.cloakscreen-protect'];
  const elements: HTMLElement[] = [];

  selectors.forEach(selector => {
    const found = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    found.forEach(el => {
      // Ensure element has an ID for targeting
      if (!el.id) {
        el.id = `cloakscreen-${Math.random().toString(36).substr(2, 9)}`;
      }
      elements.push(el);
    });
  });

  return elements;
}

/**
 * Initialize auto-protection with explicit configuration
 *
 * @param config - Protection configuration (defaults to demo mode)
 */
export function initAutoProtection(config: AutoProtectionConfig = {}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAutoProtection(config));
    return;
  }

  // Find elements to protect
  const elements = findProtectedContent();
  if (elements.length === 0) {
    coreLogger.debug('No elements found with data-cloakscreen or .cloakscreen-protect');
    return;
  }

  // Use demo provider by default
  const protectionConfig = {
    provider: 'demo' as const,
    fallback: 'blur' as const,
    debug: false,
    ...config,
  };

  // Import and protect elements
  import('../quick-start')
    .then(({ protect }) => {
      elements.forEach(async element => {
        try {
          await protect(element, protectionConfig);
          coreLogger.debug('Protected element:', element);
        } catch (error) {
          coreLogger.warn('Failed to protect element:', element, error);
        }
      });
    })
    .catch(error => {
      coreLogger.error('Failed to load protection module:', error);
    });
}
