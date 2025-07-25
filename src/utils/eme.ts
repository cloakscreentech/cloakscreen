/**
 * EME (Encrypted Media Extensions) utilities
 *
 * Provides low-level access to browser DRM capabilities
 */

/**
 * Key system identifiers
 */
export enum KeySystem {
  WIDEVINE = 'com.widevine.alpha',
  PLAYREADY = 'com.microsoft.playready',
  FAIRPLAY = 'com.apple.fps.1_0',
  CLEARKEY = 'org.w3.clearkey',
}

/**
 * Security levels for Widevine
 */
export enum SecurityLevel {
  L1 = 'L1', // Hardware-backed security
  L2 = 'L2', // Mixed hardware/software
  L3 = 'L3', // Software-only
  UNKNOWN = 'unknown',
}

/**
 * EME configuration for key system access
 */
export interface EMEConfig {
  keySystem: KeySystem;
  initDataTypes?: string[];
  audioCapabilities?: MediaKeySystemMediaCapability[];
  videoCapabilities?: MediaKeySystemMediaCapability[];
  distinctiveIdentifier?: 'required' | 'optional' | 'not-allowed';
  persistentState?: 'required' | 'optional' | 'not-allowed';
  sessionTypes?: string[];
}

/**
 * Check if EME is supported in the current browser
 */
export function isEMESupported(): boolean {
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
 * Check if a specific key system is supported
 */
export async function isKeySystemSupported(keySystem: KeySystem): Promise<boolean> {
  if (!isEMESupported()) {
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
 * Get all supported key systems
 */
export async function getSupportedKeySystems(): Promise<KeySystem[]> {
  const keySystems = Object.values(KeySystem);
  const supported: KeySystem[] = [];

  for (const keySystem of keySystems) {
    if (await isKeySystemSupported(keySystem as KeySystem)) {
      supported.push(keySystem as KeySystem);
    }
  }

  return supported;
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

      await navigator.requestMediaKeySystemAccess(KeySystem.WIDEVINE, config);
      return robustness;
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Get security level for Widevine
 */
export async function getWidevineSecurityLevel(): Promise<SecurityLevel> {
  const robustness = await getWidevineRobustnessLevel();

  if (!robustness) {
    return SecurityLevel.UNKNOWN;
  }

  if (robustness.startsWith('HW_SECURE_')) {
    return SecurityLevel.L1;
  } else if (robustness.startsWith('SW_SECURE_')) {
    return SecurityLevel.L3;
  }

  return SecurityLevel.UNKNOWN;
}

/**
 * Create a MediaKeys instance for a key system
 */
export async function createMediaKeys(keySystem: KeySystem): Promise<MediaKeys> {
  if (!isEMESupported()) {
    throw new Error('EME not supported');
  }

  const config = [
    {
      initDataTypes: ['cenc'],
      videoCapabilities: [
        {
          contentType: 'video/mp4;codecs="avc1.42E01E"',
        },
      ],
    },
  ];

  const keySystemAccess = await navigator.requestMediaKeySystemAccess(keySystem, config);
  return await keySystemAccess.createMediaKeys();
}

/**
 * Create a custom EME configuration
 */
export function createEMEConfig(config: Partial<EMEConfig>): MediaKeySystemConfiguration[] {
  return [
    {
      initDataTypes: config.initDataTypes || ['cenc'],
      videoCapabilities: config.videoCapabilities || [
        {
          contentType: 'video/mp4;codecs="avc1.42E01E"',
        },
      ],
      audioCapabilities: config.audioCapabilities || [
        {
          contentType: 'audio/mp4;codecs="mp4a.40.2"',
        },
      ],
      distinctiveIdentifier: config.distinctiveIdentifier || 'optional',
      persistentState: config.persistentState || 'optional',
      sessionTypes: config.sessionTypes || ['temporary'],
    },
  ];
}

/**
 * Get detailed EME support information
 */
export async function getEMESupport(): Promise<{
  supported: boolean;
  keySystems: Record<KeySystem, boolean>;
  widevineSecurityLevel?: SecurityLevel | undefined;
  hardwareSecuritySupported: boolean;
}> {
  const supported = isEMESupported();

  if (!supported) {
    return {
      supported: false,
      keySystems: {
        [KeySystem.WIDEVINE]: false,
        [KeySystem.PLAYREADY]: false,
        [KeySystem.FAIRPLAY]: false,
        [KeySystem.CLEARKEY]: false,
      },
      hardwareSecuritySupported: false,
    };
  }

  const keySystems = {
    [KeySystem.WIDEVINE]: await isKeySystemSupported(KeySystem.WIDEVINE),
    [KeySystem.PLAYREADY]: await isKeySystemSupported(KeySystem.PLAYREADY),
    [KeySystem.FAIRPLAY]: await isKeySystemSupported(KeySystem.FAIRPLAY),
    [KeySystem.CLEARKEY]: await isKeySystemSupported(KeySystem.CLEARKEY),
  };

  let widevineSecurityLevel: SecurityLevel | undefined;
  let hardwareSecuritySupported = false;

  if (keySystems[KeySystem.WIDEVINE]) {
    widevineSecurityLevel = await getWidevineSecurityLevel();
    hardwareSecuritySupported = widevineSecurityLevel === SecurityLevel.L1;
  }

  return {
    supported,
    keySystems,
    widevineSecurityLevel,
    hardwareSecuritySupported,
  };
}
