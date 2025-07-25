/**
 * Base types for the provider system
 */

import { KeySystem } from '../../utils/eme';

/**
 * Provider capabilities - simplified for v1.0.0
 */
export interface DRMCapabilities {
  /** Supported key systems */
  keySystems: KeySystem[];

  /** Whether hardware security is required */
  requiresHardwareSecurity: boolean;
}

/**
 * Provider defaults for configuration
 */
export interface ProviderDefaults {
  /** Default license server URL */
  licenseServer: string;

  /** Certificate URL pattern with variable substitution */
  certificatePattern?: string;

  /** Required configuration fields */
  requiredFields: string[];

  /** Optional configuration fields */
  optionalFields: string[];
}

/**
 * Provider metadata - simplified for v1.0.0
 */
export interface ProviderMetadata {
  /** Internal provider name */
  name: string;

  /** Human-readable display name */
  displayName: string;

  /** Provider description */
  description: string;

  /** Supported key systems */
  supportedKeySystems: KeySystem[];

  /** Required configuration fields */
  requiredConfig: string[];
}

/**
 * Provider health status - simplified for v1.0.0
 */
export interface ProviderHealth {
  /** Overall health status */
  status: 'healthy' | 'error';

  /** Error message if status is 'error' */
  error?: string;
}

/**
 * License request object
 */
export interface LicenseRequest {
  /** Request URL */
  url: string;

  /** Request headers */
  headers: Record<string, string>;

  /** Request body */
  body?: any;

  /** Request method */
  method: string;

  /** Content ID being requested */
  contentId?: string;

  /** User ID making the request */
  userId?: string;
}

/**
 * License response object
 */
export interface LicenseResponse {
  /** Response status code */
  status: number;

  /** Response headers */
  headers: Record<string, string>;

  /** Response body */
  body: any;

  /** Response timestamp */
  timestamp: Date;

  /** Whether the response was successful */
  success: boolean;
}

/**
 * Standard DRM configuration interface
 */
export interface StandardDRMConfig {
  /** License server URL */
  licenseServer: string;

  /** Certificate URL (for Widevine) */
  certificateUrl?: string;

  /** Custom headers to include in requests */
  headers?: Record<string, string>;

  /** Provider-specific extensions */
  [key: string]: any;
}
