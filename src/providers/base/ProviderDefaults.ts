/**
 * Provider Defaults - Centralized provider-specific default configurations
 *
 * This module defines default values for each DRM provider, eliminating
 * hardcoded provider-specific values throughout the codebase.
 */

import { providerLogger } from '../../utils/logger';

export interface ProviderDefaults {
  licenseServer: string;
  certificatePattern?: string;
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * Provider-specific default configurations
 */
export const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  pallycon: {
    licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
    certificatePattern: 'https://license-global.pallycon.com/ri/widevineCert.do?siteId={siteId}',
    requiredFields: ['siteId', 'tokenEndpoint'],
    optionalFields: ['licenseServer', 'certificateUri', 'debug'],
  },

  widevine: {
    licenseServer: 'https://widevine-proxy.appspot.com/proxy',
    certificatePattern: 'https://www.gstatic.com/widevine/cert/{siteId}',
    requiredFields: ['siteId', 'tokenEndpoint'],
    optionalFields: ['licenseServer', 'certificateUri', 'debug'],
  },

  playready: {
    licenseServer: 'https://playready.directtaps.net/pr/svc/rightsmanager.asmx',
    requiredFields: ['siteId', 'tokenEndpoint'],
    optionalFields: ['licenseServer', 'debug'],
  },

  fairplay: {
    licenseServer: 'https://fps.ezdrm.com/api/licenses/{siteId}',
    certificatePattern: 'https://fps.ezdrm.com/demo/video/eleisure.cer',
    requiredFields: ['siteId', 'tokenEndpoint'],
    optionalFields: ['licenseServer', 'certificateUri', 'debug'],
  },
};

/**
 * Get provider-specific defaults
 */
export function getProviderDefaults(provider: string): ProviderDefaults {
  const defaults = PROVIDER_DEFAULTS[provider.toLowerCase()];

  if (!defaults) {
    providerLogger.warn(`Unknown provider '${provider}', falling back to PallyCon defaults`);
    return PROVIDER_DEFAULTS.pallycon;
  }

  return defaults;
}

/**
 * Get all supported provider names
 */
export function getSupportedProviders(): string[] {
  return Object.keys(PROVIDER_DEFAULTS);
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(provider: string): boolean {
  return provider.toLowerCase() in PROVIDER_DEFAULTS;
}

/**
 * Generate provider-specific URLs with variable substitution
 */
export function generateProviderUrl(
  _provider: string,
  pattern: string,
  variables: Record<string, string>
): string {
  let url = pattern;

  // Replace variables in the pattern
  for (const [key, value] of Object.entries(variables)) {
    url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return url;
}

/**
 * Get complete provider configuration with defaults applied
 */
export function getProviderConfig(
  provider: string,
  userConfig: Record<string, any>
): Record<string, any> {
  const defaults = getProviderDefaults(provider);
  const config = { ...userConfig };

  // Apply license server default if not provided
  if (!config.licenseServer) {
    config.licenseServer = defaults.licenseServer;
  }

  // Generate certificate URI if pattern exists and siteId is provided
  if (!config.certificateUri && defaults.certificatePattern && config.siteId) {
    config.certificateUri = generateProviderUrl(provider, defaults.certificatePattern, {
      siteId: config.siteId,
    });
  }

  return config;
}

export default {
  PROVIDER_DEFAULTS,
  getProviderDefaults,
  getSupportedProviders,
  isProviderSupported,
  generateProviderUrl,
  getProviderConfig,
};
