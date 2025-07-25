/**
 * Cloakscreen - DRM-based AI Vision Blocking Library
 *
 * Protects sensitive content from screenshots and AI vision models
 * using browser DRM APIs and layered content rendering with color-matching technique.
 */

// Core library
export { Cloakscreen } from './core/Cloakscreen';
export { protect } from './quick-start';

// Providers
export {
  DRMProvider,
  PallyConProvider,
  Providers,
  createProvider,
  providerRegistry,
  ProviderFactory,
} from './providers';

// Adapters
export { ContentAdapter, TextAdapter } from './adapters';

// Essential utilities
export {
  detectBrowserCapabilities,
  detectHardwareAcceleration,
  validateConfig,
  isEMESupported,
  KeySystem,
  SecurityLevel,
  isKeySystemSupported,
  getSupportedKeySystems,
  getEMESupport,
  createEMEConfig,
} from './utils';

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
} from './utils/drm-detection';

// Auto-setup utilities
export { initAutoProtection, findProtectedContent } from './utils/auto-setup';

// Error handling
export {
  CloakscreenError,
  ErrorCode,
  ErrorCategory,
  ErrorFactory,
  ErrorHandler,
  HardwareAccelerationError,
} from './errors';

// Types
export type {
  CloakscreenConfig,
  CloakscreenInstance,
  DRMStatus,
  DRMProviderConfig,
  BrowserCapabilities,
  DRMImplementation,
  PallyConConfig,
} from './types';

// Provider types
export type { DRMCapabilities, ProviderMetadata, ProviderHealth } from './providers/base';

// Error types
export type { ErrorContext } from './errors';

// Auto-setup types
export type { AutoProtectionConfig } from './utils/auto-setup';

// DRM Video Generation & Encryption System (Node.js only)
// Note: DRM tools are available via separate entry point: 'cloakscreen/node'
// This avoids mixing Node.js and browser code in the main bundle

// Version and API management
export {
  VERSION,
  API_VERSION,
  getVersionInfo,
  isApiVersionSupported,
  compareVersions,
  meetsMinimumVersion,
} from './version';

// Simple deprecation helper
export { deprecate, clearDeprecationWarnings } from './utils/deprecation';

// React integration available as separate import
// import { useCloakscreen, CloakscreenProvider } from 'cloakscreen/react';
