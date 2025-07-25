/**
 * Version management and API versioning for Cloakscreen
 */

/**
 * Current library version
 * Note: This should be updated automatically during the build process
 */
export const VERSION = '1.0.0';

/**
 * API version - follows semantic versioning
 * Major version changes indicate breaking API changes
 */
export const API_VERSION = '1.0';

/**
 * Supported API versions for backward compatibility
 */
export const SUPPORTED_API_VERSIONS = ['1.0'];

/**
 * Minimum supported API version
 */
export const MIN_API_VERSION = '1.0';

/**
 * Version information object
 */
export interface VersionInfo {
  /** Library version */
  version: string;
  /** API version */
  apiVersion: string;
  /** Supported API versions */
  supportedVersions: string[];
  /** Build timestamp */
  buildTime: string;
  /** Git commit hash (if available) */
  gitHash?: string;
}

/**
 * Get complete version information
 */
export function getVersionInfo(): VersionInfo {
  return {
    version: VERSION,
    apiVersion: API_VERSION,
    supportedVersions: SUPPORTED_API_VERSIONS,
    buildTime: new Date().toISOString(),
    // Git hash will be injected at build time
    gitHash: process.env.GIT_HASH || undefined,
  };
}

/**
 * Check if an API version is supported
 */
export function isApiVersionSupported(version: string): boolean {
  return SUPPORTED_API_VERSIONS.includes(version);
}

/**
 * Compare two version strings
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;

    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }

  return 0;
}

/**
 * Check if a version meets minimum requirements
 */
export function meetsMinimumVersion(version: string): boolean {
  return compareVersions(version, MIN_API_VERSION) >= 0;
}
