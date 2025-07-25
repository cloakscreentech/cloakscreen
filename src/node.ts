/**
 * Node.js-specific entry point for Cloakscreen
 *
 * Provides access to DRM video generation and encryption tools
 * that are only available in Node.js environments.
 */

// Re-export core types and utilities (browser-safe)
export type * from './types';
export * from './errors';

// Re-export provider types and utilities
export type {
  DRMCapabilities,
  ProviderMetadata,
  ProviderHealth,
  PallyConConfig,
} from './providers';

// Re-export EME utilities
export {
  isEMESupported,
  KeySystem,
  SecurityLevel,
  isKeySystemSupported,
  getSupportedKeySystems,
  getEMESupport,
  createEMEConfig,
} from './utils/eme';

// Node.js-only DRM tools
export { VideoGenerator, DRMWorkflow, DRMEncryption, PallyConEncryption } from './drm';
export type {
  VideoGenerationOptions,
  EncryptionResult,
  EncryptedContent,
  DRMWorkflowOptions,
  ManifestType,
  ValidationResult,
  EncryptionCapabilities,
} from './drm';
