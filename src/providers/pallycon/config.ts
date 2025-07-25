/**
 * PallyCon configuration schema and validation
 */

import * as v from 'valibot';
import { PallyConConfig } from './types';
import { getProviderDefaults } from '../base/ProviderDefaults';

/**
 * PallyCon configuration schema with validation
 */
export const PallyConConfigSchema = v.object({
  // Required fields
  siteId: v.pipe(
    v.string(),
    v.minLength(1, 'Site ID is required'),
    v.regex(/^[A-Z0-9]{2,10}$/, 'Site ID must be 2-10 uppercase letters/numbers')
  ),

  tokenEndpoint: v.pipe(
    v.string(),
    v.minLength(1, 'Token endpoint is required'),
    v.check(
      url => url.startsWith('/') || url.startsWith('http'),
      'Token endpoint must be a relative path or full URL'
    )
  ),

  // Optional fields with defaults
  licenseServer: v.optional(v.pipe(v.string(), v.url('License server must be a valid URL'))),

  certificateUri: v.optional(v.pipe(v.string(), v.url('Certificate URI must be a valid URL'))),

  headers: v.optional(v.record(v.string(), v.string())),
  debug: v.optional(v.boolean(), false),
});

/**
 * Validate PallyCon configuration
 */
export function validatePallyConConfig(config: Partial<PallyConConfig> = {}): PallyConConfig {
  try {
    // Apply provider defaults before validation
    const defaults = getProviderDefaults('pallycon');
    const configWithDefaults = {
      ...config,
      licenseServer: config?.licenseServer || defaults.licenseServer,
      certificateUri:
        config?.certificateUri ||
        (config?.siteId
          ? defaults.certificatePattern?.replace('{siteId}', config.siteId)
          : undefined),
    };

    return v.parse(PallyConConfigSchema, configWithDefaults) as PallyConConfig;
  } catch (error) {
    if (v.isValiError(error)) {
      const errorMessages = v.flatten(error.issues).nested;
      const formattedErrors = Object.entries(errorMessages || {}).map(
        ([path, issues]) => `${path}: ${(issues?.[0] as any)?.message || 'Invalid value'}`
      );
      throw new Error(`PallyCon configuration validation failed:\n${formattedErrors.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Create default PallyCon configuration
 */
export function createDefaultPallyConConfig(
  overrides: Partial<PallyConConfig> = {}
): PallyConConfig {
  const providerDefaults = getProviderDefaults('pallycon');
  const defaults: Partial<PallyConConfig> = {
    tokenEndpoint: '/api/get-license-token',
    licenseServer: providerDefaults.licenseServer,
    debug: false,
  };

  return validatePallyConConfig({ ...defaults, ...overrides });
}

/**
 * Create PallyCon cloud configuration
 */
export function createPallyConCloudConfig(
  siteId: string,
  cloudEndpoint: string = 'https://cloud.cloakscreen.com'
): PallyConConfig {
  const providerDefaults = getProviderDefaults('pallycon');

  return validatePallyConConfig({
    siteId,
    tokenEndpoint: `${cloudEndpoint}/api/license-token`,
    licenseServer: providerDefaults.licenseServer,
  });
}

/**
 * Auto-detect PallyCon configuration from environment
 */
export function autoDetectPallyConConfig(): Partial<PallyConConfig> | null {
  const getEnvVar = (key: string): string | undefined => {
    // Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }

    // Browser environment (Vite, Webpack, etc.)
    try {
      // Use dynamic import to avoid Jest syntax errors
      const importMeta =
        (globalThis as any).importMeta ||
        (typeof window !== 'undefined' && (window as any).importMeta);
      if (importMeta?.env) {
        return importMeta.env[key];
      }
    } catch {
      // Ignore if import.meta is not available
    }

    // Legacy browser environment
    if (typeof window !== 'undefined' && (window as any).env) {
      return (window as any).env[key];
    }

    return undefined;
  };

  const config: Partial<PallyConConfig> = {};

  // Try to detect from environment variables
  const siteId = getEnvVar('DRM_SITE_ID');
  const tokenEndpoint = getEnvVar('DRM_TOKEN_ENDPOINT');
  const licenseServer = getEnvVar('DRM_LICENSE_SERVER');
  const debug = getEnvVar('DRM_DEBUG');

  if (siteId) config.siteId = siteId;
  if (tokenEndpoint) config.tokenEndpoint = tokenEndpoint;
  if (licenseServer) config.licenseServer = licenseServer;
  if (debug) config.debug = debug.toLowerCase() === 'true';

  return Object.keys(config).length > 0 ? config : null;
}
