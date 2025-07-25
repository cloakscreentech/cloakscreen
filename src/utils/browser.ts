/**
 * Browser detection and capability utilities
 *
 * Detects browser capabilities for DRM support and security features
 */

import { BrowserCapabilities } from '../types';

/**
 * Detect browser capabilities
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  // SSR safety check
  if (typeof navigator === 'undefined') {
    return {
      browser: 'unknown',
      supportsEME: false,
      supportedKeySystems: [],
      hardwareSecuritySupport: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const browser = detectBrowserName(userAgent);

  return {
    browser,
    supportsEME: supportsEME(),
    supportedKeySystems: getSupportedKeySystems(),
    hardwareSecuritySupport: supportsHardwareSecurity(browser),
  };
}

/**
 * Detect browser name
 */
function detectBrowserName(userAgent: string): string {
  if (userAgent.includes('edge/') || userAgent.includes('edg/')) {
    return 'Edge';
  } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'Chrome';
  } else if (userAgent.includes('firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'Safari';
  } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
    return 'Opera';
  } else {
    return 'Unknown';
  }
}

/**
 * Check if browser supports EME (Encrypted Media Extensions)
 */
function supportsEME(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  return !!(
    'requestMediaKeySystemAccess' in navigator &&
    'MediaKeys' in window &&
    'MediaKeySystemAccess' in window
  );
}

/**
 * Get list of supported key systems
 */
function getSupportedKeySystems(): string[] {
  // Return potential key systems based on browser
  // Actual support testing requires async calls

  // This is a synchronous check, actual support testing requires async calls
  // For now, return potential key systems based on browser
  if (typeof navigator === 'undefined') {
    return [];
  }

  const browser = detectBrowserName(navigator.userAgent.toLowerCase());

  switch (browser) {
    case 'Chrome':
    case 'Edge':
      return ['com.widevine.alpha'];
    case 'Firefox':
      return ['com.widevine.alpha'];
    case 'Safari':
      return ['com.apple.fps.1_0'];
    default:
      return [];
  }
}

/**
 * Check if browser supports hardware security
 */
function supportsHardwareSecurity(browser: string): boolean {
  // Hardware security is primarily available on:
  // - Chrome/Edge on Windows with secure hardware
  // - Chrome on Android with hardware-backed keystore
  // - Safari on macOS/iOS with Secure Enclave

  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (browser === 'Chrome' || browser === 'Edge') {
    return userAgent.includes('windows') || userAgent.includes('android');
  } else if (browser === 'Safari') {
    return userAgent.includes('mac') || userAgent.includes('iphone') || userAgent.includes('ipad');
  }

  return false;
}

/**
 * Check if running on Windows Chrome (for L1 support)
 */
export function isWindowsChrome(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('windows') && userAgent.includes('chrome');
}

/**
 * Test key system access asynchronously
 */
export async function testKeySystemAccess(keySystem: string): Promise<boolean> {
  if (!supportsEME()) {
    return false;
  }

  try {
    const config = [
      {
        initDataTypes: ['cenc'],
        videoCapabilities: [
          {
            contentType: 'video/mp4;codecs="avc1.42E01E"',
          },
        ],
        audioCapabilities: [
          {
            contentType: 'audio/mp4;codecs="mp4a.40.2"',
          },
        ],
      },
    ];

    await navigator.requestMediaKeySystemAccess(keySystem, config);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get highest supported Widevine robustness level
 */
export async function getWidevineRobustnessLevel(): Promise<string | null> {
  const robustnessLevels = [
    'HW_SECURE_ALL',
    'HW_SECURE_DECODE',
    'HW_SECURE_CRYPTO',
    'SW_SECURE_DECODE',
    'SW_SECURE_CRYPTO',
  ];

  for (const robustness of robustnessLevels) {
    try {
      const config = [
        {
          initDataTypes: ['cenc'],
          videoCapabilities: [
            {
              contentType: 'video/mp4;codecs="avc1.42E01E"',
              robustness: robustness,
            },
          ],
        },
      ];

      await navigator.requestMediaKeySystemAccess('com.widevine.alpha', config);
      return robustness;
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Check if device supports hardware-backed DRM
 */
export async function supportsHardwareBackedDRM(): Promise<boolean> {
  const robustness = await getWidevineRobustnessLevel();
  return robustness ? robustness.startsWith('HW_SECURE_') : false;
}

/**
 * Get security level (L1, L2, L3) for Widevine
 */
export async function getWidevineSecurityLevel(): Promise<'L1' | 'L2' | 'L3' | 'unknown'> {
  const robustness = await getWidevineRobustnessLevel();

  if (!robustness) {
    return 'unknown';
  }

  if (robustness.startsWith('HW_SECURE_')) {
    return 'L1';
  } else if (robustness.startsWith('SW_SECURE_')) {
    return 'L3';
  }

  return 'unknown';
}
