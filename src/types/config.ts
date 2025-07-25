/**
 * Configuration type definitions
 *
 * Provides proper typing for configuration objects
 * to replace generic 'any' types throughout the codebase.
 */

/**
 * Generic provider configuration interface
 */
export interface ProviderConfig {
  /** Provider name */
  name?: string;

  /** Provider-specific settings */
  [key: string]: unknown;
}

// Re-export from main types to avoid duplication
export type { DRMProviderConfig } from './index';

// Re-export from main types to avoid duplication
export type { PallyConConfig as PallyConProviderConfig } from './index';

/**
 * DRM workflow configuration
 */
export interface DRMWorkflowConfig {
  /** DRM provider name */
  provider: string;

  /** Output directory for generated content */
  outputDir: string;

  /** Content ID */
  contentId?: string;

  /** Video generation options */
  videoOptions?: VideoGenerationConfig;

  /** Whether to validate encryption */
  validate?: boolean;

  /** Whether to cleanup temporary files */
  cleanup?: boolean;
}

/**
 * Video generation configuration
 */
export interface VideoGenerationConfig {
  /** Video width in pixels */
  width: number;

  /** Video height in pixels */
  height: number;

  /** Video duration in seconds */
  duration: number;

  /** Frame rate */
  fps: number;

  /** Video format */
  format: 'mp4' | 'webm';

  /** Background color */
  color: string;

  /** Video codec */
  codec?: string;
}

/**
 * Token generation configuration
 */
export interface TokenGenerationConfig {
  /** Content ID */
  contentId?: string;

  /** User ID */
  userId?: string;

  /** DRM type */
  drmType?: string;

  /** DRM policy */
  policy?: DRMPolicy;
}

/**
 * DRM policy configuration
 */
export interface DRMPolicy {
  /** Policy version */
  policy_version: number;

  /** Playback policy */
  playback_policy: {
    /** Whether persistent licenses are allowed */
    persistent: boolean;

    /** License duration in seconds */
    license_duration_seconds: number;

    /** Playback duration in seconds */
    playback_duration_seconds: number;
  };

  /** Additional policy settings */
  [key: string]: unknown;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Sanitized configuration */
  sanitized?: unknown;
}

/**
 * Event data interfaces
 */
export interface EventData {
  /** Event timestamp */
  timestamp?: Date;

  /** Additional event properties */
  [key: string]: unknown;
}

export interface ContentChangedEventData extends EventData {
  /** New content */
  content: string;
}

export interface DRMReadyEventData extends EventData {
  /** DRM status */
  drmStatus: {
    supported: boolean;
    keySystem?: string;
    securityLevel?: string;
  };
}

export interface SecurityViolationEventData extends EventData {
  /** Violation type */
  type: string;

  /** Violation details */
  details: string[];
}
