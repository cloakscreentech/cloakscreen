/**
 * DRM Provider exports and registry system
 *
 * Provides access to DRM providers through the new registry-based architecture
 */

import { DRMProviderConfig } from '../types';
import { PallyConProvider } from './pallycon';
import { DRMProvider, providerRegistry } from './base';

// Register built-in providers
providerRegistry.register('pallycon', PallyConProvider);

/**
 * Provider factory - creates appropriate DRM provider instance
 * Now uses the registry system for better extensibility
 */
export function createProvider(config: DRMProviderConfig | string): DRMProvider {
  if (typeof config === 'string') {
    // Handle string shorthand - create with default config
    return createProviderFromPreset(config);
  }

  // Handle full configuration object
  const providerName = config.name || 'pallycon'; // Default to pallycon if no name specified
  return providerRegistry.create(providerName, config);
}

/**
 * Create provider from preset name with default configurations
 */
function createProviderFromPreset(preset: string): DRMProvider {
  throw new Error(
    `Provider preset "${preset}" requires explicit configuration. Available providers: ${providerRegistry.getAvailable().join(', ')}`
  );
}

/**
 * Provider utilities
 */
export const Providers = {
  /**
   * Get all available providers
   */
  getAvailable: () => providerRegistry.getAvailable(),

  /**
   * Get provider metadata
   */
  getMetadata: (name: string) => providerRegistry.getMetadata(name),

  /**
   * Check if provider is supported
   */
  isSupported: (name: string) => providerRegistry.isSupported(name),
};

// Core provider system
export { providerRegistry, ProviderFactory, configurationManager } from './base';
export { DRMProvider } from './base';

// Provider implementations
export { PallyConProvider } from './pallycon';

// Provider utilities
export {
  validatePallyConConfig,
  createDefaultPallyConConfig,
  createPallyConCloudConfig,
  autoDetectPallyConConfig,
} from './pallycon';

// Types
export type { PallyConConfig } from './pallycon';
export type {
  DRMCapabilities,
  ProviderMetadata,
  ProviderHealth,
  ValidatedProviderConfig,
  ConfigValidationResult,
  LicenseRequest,
  LicenseResponse,
  StandardDRMConfig,
} from './base';

// Note: Removed re-exports of shared utilities to reduce bundle size
// Users should import these directly from their respective modules:
// - getEMESupport from 'cloakscreen/utils/eme'
// - EventEmitter from 'cloakscreen/utils/EventEmitter'
// - DRMImplementation type from 'cloakscreen/types'
