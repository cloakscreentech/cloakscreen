/**
 * Quick Start API for Cloakscreen
 *
 * Provides the simplest possible API for getting started
 */

import { Cloakscreen } from './core/Cloakscreen';
import { CloakscreenConfig } from './types';

/**
 * Protect content with flexible configuration options
 *
 * This is the main entry point for Cloakscreen protection. It provides a simple API
 * that works for demo, cloud, and self-hosted deployments.
 *
 * @example
 * ```typescript
 * // Demo mode (no setup required)
 * const cloak = await protect('#content');
 *
 * // Cloud deployment
 * const cloak = await protect('#content', {
 *   provider: 'cloud',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Self-hosted deployment
 * const cloak = await protect('#content', {
 *   provider: 'self-hosted',
 *   siteId: 'YOUR_SITE_ID',
 *   tokenEndpoint: '/api/get-license-token'
 * });
 * ```
 *
 * @param element - CSS selector string or HTMLElement to protect
 * @param options - Configuration options for different deployment scenarios
 * @returns Promise that resolves to a Cloakscreen instance
 * @throws {CloakscreenError} When configuration is invalid or DRM initialization fails
 */
export async function protect(
  element: string | HTMLElement,
  options: {
    // Provider configuration - can be string or object
    provider?: 'demo' | 'cloud' | 'self-hosted' | { name: string; config: any };
    apiKey?: string;
    siteId?: string;
    tokenEndpoint?: string;

    // Security and behavior options
    fallback?: 'blur' | 'hide' | 'placeholder';
    debug?: boolean;

    // Advanced configuration (for custom setups)
    config?: Partial<CloakscreenConfig>;
  } = {}
): Promise<Cloakscreen> {
  // If custom config is provided, merge with element and use it
  if (options.config) {
    const config: CloakscreenConfig = {
      element,
      provider: 'pallycon', // Default provider if not specified
      ...options.config,
    };
    const cloak = new Cloakscreen(config);
    await cloak.protect();
    return cloak;
  }

  // Handle direct provider object
  if (typeof options.provider === 'object') {
    const config: CloakscreenConfig = {
      element,
      provider: options.provider,
      options: {
        fallbackMode: options.fallback || 'blur',
        debug: options.debug || false,
      },
    };
    const cloak = new Cloakscreen(config);
    await cloak.protect();
    return cloak;
  }

  // Build configuration based on provider type
  let config: CloakscreenConfig;

  if (options.provider === 'cloud' && options.apiKey) {
    // Cloud configuration
    config = {
      element,
      provider: {
        name: 'pallycon',
        config: {
          siteId: options.siteId || 'CLOUD',
          tokenEndpoint: `https://cloud.cloakscreen.tech/api/license-token?key=${options.apiKey}`,
        },
      },
      options: {
        fallbackMode: options.fallback || 'blur',
        debug: options.debug || false,
      },
    };
  } else if (options.provider === 'self-hosted' && options.siteId) {
    // Self-hosted configuration
    config = {
      element,
      provider: {
        name: 'pallycon',
        config: {
          siteId: options.siteId,
          tokenEndpoint: options.tokenEndpoint || '/api/get-license-token',
        },
      },
      options: {
        fallbackMode: options.fallback || 'blur',
        debug: options.debug || false,
      },
    };
  } else {
    // Auto-detect configuration from environment variables
    const { getDRMCredentials } = await import('./utils/env');
    const { provider, siteId, tokenEndpoint, licenseServer, certificateUri } = getDRMCredentials();

    if (siteId && tokenEndpoint) {
      // Use environment credentials with provider-specific defaults
      const providerConfig: any = {
        siteId,
        tokenEndpoint,
      };

      // Add provider-specific fields if available
      if (licenseServer) providerConfig.licenseServer = licenseServer;
      if (certificateUri) providerConfig.certificateUri = certificateUri;

      config = {
        element,
        provider: {
          name: provider,
          config: providerConfig,
        },
        options: {
          fallbackMode: options.fallback || 'blur',
          debug: options.debug || false,
        },
      };
    } else {
      // No configuration available - require explicit setup
      throw new Error(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} provider requires siteId to be configured. Please provide:\n` +
          '1. Environment variables (DRM_SITE_ID, DRM_TOKEN_ENDPOINT), or\n' +
          '2. Explicit configuration: protect(element, { provider: { name: "' +
          provider +
          '", config: { siteId: "YOUR_SITE_ID" } } }), or\n' +
          '3. Cloud API key: protect(element, { provider: "cloud", apiKey: "YOUR_API_KEY" })'
      );
    }
  }

  const cloak = new Cloakscreen(config);
  await cloak.protect();
  return cloak;
}
