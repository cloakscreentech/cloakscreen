/**
 * PallyCon-specific types and interfaces
 */

/**
 * PallyCon provider configuration
 */
export interface PallyConConfig {
  /** PallyCon Site ID */
  siteId: string;

  /** Token endpoint URL */
  tokenEndpoint: string;

  /** License server URL (defaults to PallyCon global) */
  licenseServer: string;

  /** Optional: Custom certificate URI (defaults to PallyCon global) */
  certificateUri?: string;

  /** Optional: Custom headers for requests */
  headers?: Record<string, string>;

  /** Optional: Enable debug logging */
  debug?: boolean;

  /** Optional: Manifest URL for DRM content */
  manifestUrl?: string;

  /** Optional: Content ID for DRM licensing */
  contentId?: string;

  /** Provider-specific settings */
  [key: string]: unknown;
}

/**
 * PallyCon token request payload
 */
export interface PallyConTokenRequest {
  /** Content identifier */
  contentId: string;

  /** User identifier */
  userId: string;

  /** DRM type (Widevine, PlayReady, FairPlay) */
  drmType: 'Widevine' | 'PlayReady' | 'FairPlay';

  /** Optional: Token validity timestamp */
  timestamp?: string;

  /** Optional: Additional policy rules */
  policy?: Record<string, any>;
}

/**
 * PallyCon token response
 */
export interface PallyConTokenResponse {
  /** License token */
  token: string;

  /** Token expiration time */
  expires?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * PallyCon error response
 */
export interface PallyConError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Additional error details */
  details?: Record<string, any>;
}
