/**
 * Base provider system exports - standardized barrel pattern
 */

// Core classes
export { DRMProvider } from './DRMProvider';
export { ProviderRegistry, providerRegistry } from './ProviderRegistry';
export { default as ProviderFactory } from './ProviderFactory';
export { ConfigurationManager, configurationManager } from './ConfigurationManager';

// Provider utilities
export {
  getProviderDefaults,
  getSupportedProviders,
  isProviderSupported,
  getProviderConfig,
  PROVIDER_DEFAULTS,
} from './ProviderDefaults';

// Types
export type {
  DRMCapabilities,
  ProviderMetadata,
  ProviderDefaults,
  ProviderHealth,
  LicenseRequest,
  LicenseResponse,
  StandardDRMConfig,
} from './types';
export type { ValidatedProviderConfig, ConfigValidationResult } from './ConfigurationManager';
