/**
 * Environment variable utilities for secure credential management
 */

/**
 * Get environment variable with fallback
 * Works in both Node.js and browser environments
 */
function getEnvVar(key: string, fallback?: string): string | undefined {
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }

  // Browser environment (Vite, Webpack, etc.)
  try {
    // Use dynamic import to avoid Jest syntax errors
    const importMeta =
      (globalThis as any).importMeta ||
      (typeof window !== 'undefined' && (window as any).importMeta);
    if (importMeta?.env) {
      return importMeta.env[key] || fallback;
    }
  } catch {
    // Ignore if import.meta is not available
  }

  // Legacy browser environment
  if (typeof window !== 'undefined' && (window as any).env) {
    return (window as any).env[key] || fallback;
  }

  return fallback;
}

/**
 * Get PallyCon credentials from environment variables
 */
export function getDRMCredentials() {
  const provider = getEnvVar('DRM_PROVIDER') || 'pallycon';

  // Use hardcoded PallyCon defaults to avoid circular dependencies
  // This is acceptable since we're simplifying to single provider for now
  const providerDefaults = {
    licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
    certificatePattern: 'https://license-global.pallycon.com/ri/widevineCert.do?siteId={siteId}',
    requiredFields: ['siteId', 'tokenEndpoint'],
    optionalFields: ['licenseServer', 'certificateUri', 'debug'],
  };

  const siteId = getEnvVar('DRM_SITE_ID');

  return {
    provider,
    siteId,
    tokenEndpoint: getEnvVar('DRM_TOKEN_ENDPOINT') || '/api/get-license-token',
    licenseServer: getEnvVar('DRM_LICENSE_SERVER') || providerDefaults.licenseServer,
    certificateUri:
      getEnvVar('DRM_CERTIFICATE_URI') ||
      (siteId && providerDefaults.certificatePattern
        ? providerDefaults.certificatePattern.replace('{siteId}', siteId)
        : undefined),
    manifestUrl: getEnvVar('DRM_MANIFEST_URL') || '/dash_assets/stream.mpd',
  };
}

/**
 * Get Cloakscreen Cloud API key from environment variables
 */
export function getCloakscreenCloudCredentials() {
  return {
    apiKey: getEnvVar('CLOAKSCREEN_API_KEY'),
  };
}
