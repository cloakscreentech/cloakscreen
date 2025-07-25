/**
 * Types for DRM video generation and encryption system
 */

/**
 * Video generation options
 */
export interface VideoGenerationOptions {
  /** Video width in pixels */
  width: number;

  /** Video height in pixels */
  height: number;

  /** Video color (named color, hex, or 'transparent') */
  color: string;

  /** Video duration in seconds */
  duration: number;

  /** Frames per second */
  fps: number;

  /** Output format */
  format: 'mp4' | 'webm';

  /** Video codec */
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';

  /** Bitrate in kbps */
  bitrate?: number;

  /** Enable alpha channel for transparency */
  alphaChannel?: boolean;

  /** Provider-specific optimizations */
  providerOptimizations?: Record<string, any>;
}

/**
 * DRM encryption result
 */
export interface EncryptionResult {
  /** Success status */
  success: boolean;

  /** Path to encrypted content directory */
  outputPath: string;

  /** Generated manifest file path */
  manifestPath: string;

  /** Encryption metadata */
  metadata: {
    provider: string;
    keyId: string;
    contentId: string;
    encryptionTime: Date;
    manifestType: ManifestType;
  };

  /** Any errors that occurred */
  errors?: string[];

  /** Warnings */
  warnings?: string[];
}

/**
 * Encrypted content information
 */
export interface EncryptedContent {
  /** Content ID */
  contentId: string;

  /** Encryption key ID */
  keyId: string;

  /** Encrypted video segments */
  segments: EncryptedSegment[];

  /** Initialization data */
  initData?: Uint8Array;

  /** DRM system specific data */
  drmSystemData: Record<string, any>;
}

/**
 * Encrypted video segment
 */
export interface EncryptedSegment {
  /** Segment file path */
  path: string;

  /** Segment duration */
  duration: number;

  /** Segment index */
  index: number;

  /** Encryption key for this segment */
  keyId: string;

  /** Initialization vector */
  iv?: Uint8Array;
}

/**
 * Manifest types supported
 */
export type ManifestType = 'dash' | 'hls' | 'smooth';

/**
 * DRM workflow options
 */
export interface DRMWorkflowOptions {
  /** DRM provider name */
  provider: string;

  /** Video generation options */
  videoOptions: VideoGenerationOptions;

  /** Output directory for all generated content */
  outputDir: string;

  /** Content ID for DRM */
  contentId?: string;

  /** Manifest type to generate */
  manifestType?: ManifestType;

  /** Provider-specific configuration */
  providerConfig?: Record<string, any>;

  /** Whether to validate encryption after completion */
  validate?: boolean;

  /** Clean up temporary files */
  cleanup?: boolean;
}

/**
 * Video validation result
 */
export interface ValidationResult {
  /** Validation success */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Playback test results */
  playbackTest?: {
    canLoad: boolean;
    canPlay: boolean;
    drmActive: boolean;
    errorMessage?: string;
  };
}

/**
 * Provider encryption capabilities
 */
export interface EncryptionCapabilities {
  /** Supported video formats */
  videoFormats: string[];

  /** Supported manifest types */
  manifestTypes: ManifestType[];

  /** Encryption tool type */
  encryptionTool: 'cli' | 'api' | 'sdk';

  /** Whether local tools are required */
  requiresLocalTool: boolean;

  /** Supported key systems */
  keySystems: string[];

  /** Maximum video dimensions */
  maxDimensions?: {
    width: number;
    height: number;
  };

  /** Supported codecs */
  supportedCodecs: string[];
}
