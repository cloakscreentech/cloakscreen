/**
 * DRM Video Generation & Encryption System
 *
 * This module provides the critical missing piece: generating and encrypting
 * blank videos for the three-layer protection system across multiple DRM providers.
 */

export { VideoGenerator } from './VideoGenerator';
export { DRMWorkflow } from './DRMWorkflow';
export { DRMEncryption } from './base/DRMEncryption';

// Provider-specific encryption implementations
export { PallyConEncryption } from './providers/PallyConEncryption';

// Types
export type {
  VideoGenerationOptions,
  EncryptionResult,
  EncryptedContent,
  DRMWorkflowOptions,
  ManifestType,
  ValidationResult,
  EncryptionCapabilities,
} from './types';
