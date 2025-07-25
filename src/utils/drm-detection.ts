/**
 * Enhanced DRM Detection Utilities
 *
 * Implements comprehensive DRM detection following industry best practices
 * to determine the optimal DRM system (Widevine, FairPlay, PlayReady) for the current environment.
 */

import { KeySystem } from './eme';

/**
 * DRM system types
 */
export type DRMType = 'widevine' | 'fairplay' | 'playready' | 'clearkey' | 'none';

/**
 * Browser information
 */
export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isSupported: boolean;
}

/**
 * Platform information
 */
export interface PlatformInfo {
  os: string;
  device: string;
  isAppleEcosystem: boolean;
  isMobile: boolean;
}

/**
 * Security capabilities
 */
export interface SecurityCapabilities {
  hardwareSecurityAvailable: boolean;
  widevineSecurityLevel: 'L1' | 'L2' | 'L3' | 'unknown';
  playreadySecurityLevel: string | null;
  fairplayAvailable: boolean;
}

/**
 * DRM detection result with detailed information
 */
export interface DRMDetectionResult {
  primaryDRM: DRMType;
  supportedDRMs: DRMType[];
  browser: BrowserInfo;
  platform: PlatformInfo;
  security: SecurityCapabilities;
  recommendations: string[];
}

/**
 * DRM system configuration for testing
 */
interface DRMSystemConfig {
  keySystem: string;
  name: DRMType;
  testConfig: MediaKeySystemConfiguration[];
  priority: number;
  platformRequirements?: (platform: PlatformInfo, browser: BrowserInfo) => boolean;
}

/**
 * Comprehensive DRM detection and selection
 */
export async function detectOptimalDRM(): Promise<DRMDetectionResult> {
  const browser = detectBrowser();
  const platform = detectPlatform();

  if (!isEMESupported()) {
    return createUnsupportedResult(browser, platform, 'EME not supported');
  }

  const drmSystems = getDRMSystemConfigs();
  const supportedDRMs: DRMType[] = [];
  const security = await detectSecurityCapabilities();

  for (const drmSystem of drmSystems) {
    if (drmSystem.platformRequirements && !drmSystem.platformRequirements(platform, browser)) {
      continue;
    }

    let isSupported = false;

    // Special handling for FairPlay on Safari
    if (drmSystem.name === 'fairplay' && browser.name === 'Safari') {
      isSupported = await testFairPlaySupport();
    } else {
      isSupported = await testDRMSystem(drmSystem);
    }

    if (isSupported) {
      supportedDRMs.push(drmSystem.name);
    }
  }

  const primaryDRM = selectPrimaryDRM(supportedDRMs, platform, browser);
  const recommendations = generateRecommendations(supportedDRMs, platform, browser, security);

  return {
    primaryDRM,
    supportedDRMs,
    browser,
    platform,
    security,
    recommendations,
  };
}

/**
 * Test if a specific DRM system is supported
 */
async function testDRMSystem(drmSystem: DRMSystemConfig): Promise<boolean> {
  try {
    await navigator.requestMediaKeySystemAccess(drmSystem.keySystem, drmSystem.testConfig);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get DRM system configurations in priority order
 */
function getDRMSystemConfigs(): DRMSystemConfig[] {
  const baseVideoCapabilities: MediaKeySystemMediaCapability[] = [
    { contentType: 'video/mp4;codecs="avc1.42E01E"' },
    { contentType: 'video/webm;codecs="vp9"' },
  ];

  const baseAudioCapabilities: MediaKeySystemMediaCapability[] = [
    { contentType: 'audio/mp4;codecs="mp4a.40.2"' },
    { contentType: 'audio/webm;codecs="opus"' },
  ];

  const configs: DRMSystemConfig[] = [
    {
      keySystem: KeySystem.FAIRPLAY,
      name: 'fairplay',
      priority: 1,
      testConfig: [
        {
          initDataTypes: ['skd'],
          videoCapabilities: baseVideoCapabilities,
          audioCapabilities: baseAudioCapabilities,
          distinctiveIdentifier: 'required',
          persistentState: 'required',
        },
      ],
      platformRequirements: (platform: PlatformInfo, browser: BrowserInfo) =>
        platform.isAppleEcosystem && browser.name === 'Safari',
    },
    {
      keySystem: KeySystem.WIDEVINE,
      name: 'widevine',
      priority: 2,
      testConfig: [
        {
          initDataTypes: ['cenc'],
          videoCapabilities: baseVideoCapabilities,
          audioCapabilities: baseAudioCapabilities,
          distinctiveIdentifier: 'optional',
          persistentState: 'optional',
        },
      ],
      platformRequirements: (platform: PlatformInfo, browser: BrowserInfo) =>
        !platform.isAppleEcosystem || browser.name !== 'Safari',
    },
    {
      keySystem: KeySystem.PLAYREADY,
      name: 'playready',
      priority: 3,
      testConfig: [
        {
          initDataTypes: ['cenc'],
          videoCapabilities: baseVideoCapabilities,
          audioCapabilities: baseAudioCapabilities,
          distinctiveIdentifier: 'optional',
          persistentState: 'optional',
        },
      ],
      platformRequirements: (platform: PlatformInfo, browser: BrowserInfo) =>
        platform.os === 'Windows' && (browser.name === 'Edge' || browser.name === 'IE'),
    },
    {
      keySystem: KeySystem.CLEARKEY,
      name: 'clearkey',
      priority: 4,
      testConfig: [
        {
          initDataTypes: ['cenc'],
          videoCapabilities: baseVideoCapabilities,
          audioCapabilities: baseAudioCapabilities,
          distinctiveIdentifier: 'optional',
          persistentState: 'optional',
        },
      ],
    },
  ];

  return configs.sort((a, b) => a.priority - b.priority);
}

/**
 * Select the primary DRM system based on platform and browser
 */
function selectPrimaryDRM(
  supportedDRMs: DRMType[],
  platform: PlatformInfo,
  browser: BrowserInfo
): DRMType {
  if (supportedDRMs.length === 0) {
    return 'none';
  }

  if (
    platform.isAppleEcosystem &&
    browser.name === 'Safari' &&
    supportedDRMs.includes('fairplay')
  ) {
    return 'fairplay';
  }

  if (platform.os === 'Windows' && browser.name === 'Edge') {
    if (supportedDRMs.includes('playready')) {
      return 'playready';
    }
  }

  if (supportedDRMs.includes('widevine')) {
    return 'widevine';
  }

  return supportedDRMs[0];
}

/**
 * Detect browser information
 */
function detectBrowser(): BrowserInfo {
  if (typeof navigator === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
      engine: 'unknown',
      isSupported: false,
    };
  }

  const userAgent = navigator.userAgent;
  const userAgentLower = userAgent.toLowerCase();

  let name = 'unknown';
  let version = 'unknown';
  let engine = 'unknown';

  if (userAgentLower.includes('edg/')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    version = match ? match[1] : 'unknown';
    engine = 'Chromium';
  } else if (userAgentLower.includes('chrome') && !userAgentLower.includes('edg')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1] : 'unknown';
    engine = 'Chromium';
  } else if (userAgentLower.includes('firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1] : 'unknown';
    engine = 'Gecko';
  } else if (userAgentLower.includes('safari') && !userAgentLower.includes('chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    version = match ? match[1] : 'unknown';
    engine = 'WebKit';
  } else if (userAgentLower.includes('opera') || userAgentLower.includes('opr')) {
    name = 'Opera';
    const match = userAgent.match(/(?:Opera|OPR)\/([0-9.]+)/);
    version = match ? match[1] : 'unknown';
    engine = 'Chromium';
  }

  const isSupported =
    ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'].includes(name) && isEMESupported();

  return { name, version, engine, isSupported };
}

/**
 * Detect platform information
 */
function detectPlatform(): PlatformInfo {
  if (typeof navigator === 'undefined') {
    return {
      os: 'unknown',
      device: 'unknown',
      isAppleEcosystem: false,
      isMobile: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  let os = 'unknown';
  let device = 'desktop';

  if (userAgent.includes('windows') || platform.includes('win')) {
    os = 'Windows';
  } else if (userAgent.includes('mac') || platform.includes('mac')) {
    os = 'macOS';
  } else if (userAgent.includes('iphone')) {
    os = 'iOS';
    device = 'mobile';
  } else if (userAgent.includes('ipad')) {
    os = 'iPadOS';
    device = 'tablet';
  } else if (userAgent.includes('android')) {
    os = 'Android';
    device = userAgent.includes('mobile') ? 'mobile' : 'tablet';
  } else if (userAgent.includes('linux')) {
    os = 'Linux';
  }

  const isAppleEcosystem = ['macOS', 'iOS', 'iPadOS'].includes(os);
  const isMobile = device === 'mobile' || device === 'tablet';

  return { os, device, isAppleEcosystem, isMobile };
}

/**
 * Detect security capabilities
 */
async function detectSecurityCapabilities(): Promise<SecurityCapabilities> {
  const capabilities: SecurityCapabilities = {
    hardwareSecurityAvailable: false,
    widevineSecurityLevel: 'unknown',
    playreadySecurityLevel: null,
    fairplayAvailable: false,
  };

  try {
    const widevineLevel = await detectWidevineSecurityLevel();
    capabilities.widevineSecurityLevel = widevineLevel;
    capabilities.hardwareSecurityAvailable = widevineLevel === 'L1';
  } catch (error) {
    // Widevine not available
  }

  try {
    capabilities.fairplayAvailable = await testFairPlaySupport();
    // If FairPlay is available, it's always hardware-backed on Apple devices
    if (capabilities.fairplayAvailable && !capabilities.hardwareSecurityAvailable) {
      capabilities.hardwareSecurityAvailable = true;
    }
  } catch (error) {
    // FairPlay not available
  }

  try {
    capabilities.playreadySecurityLevel = await detectPlayReadySecurityLevel();
  } catch (error) {
    // PlayReady not available
  }

  return capabilities;
}

/**
 * Detect Widevine security level
 */
async function detectWidevineSecurityLevel(): Promise<'L1' | 'L2' | 'L3' | 'unknown'> {
  const robustnessLevels = [
    { level: 'L1' as const, robustness: ['HW_SECURE_ALL', 'HW_SECURE_DECODE', 'HW_SECURE_CRYPTO'] },
    { level: 'L3' as const, robustness: ['SW_SECURE_DECODE', 'SW_SECURE_CRYPTO'] },
  ];

  for (const { level, robustness } of robustnessLevels) {
    for (const rob of robustness) {
      try {
        const config = [
          {
            initDataTypes: ['cenc'],
            videoCapabilities: [
              {
                contentType: 'video/mp4;codecs="avc1.42E01E"',
                robustness: rob,
              },
            ],
          },
        ];

        await navigator.requestMediaKeySystemAccess(KeySystem.WIDEVINE, config);
        return level;
      } catch (error) {
        continue;
      }
    }
  }

  try {
    const config = [
      {
        initDataTypes: ['cenc'],
        videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }],
      },
    ];

    await navigator.requestMediaKeySystemAccess(KeySystem.WIDEVINE, config);
    return 'L3';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Test FairPlay support
 */
async function testFairPlaySupport(): Promise<boolean> {
  // First try the WebKit-specific API
  if (typeof (window as any).WebKitMediaKeys !== 'undefined') {
    try {
      return (window as any).WebKitMediaKeys.isTypeSupported(KeySystem.FAIRPLAY, 'video/mp4');
    } catch (error) {
      // Continue to EME test
    }
  }

  // Try standard EME API for FairPlay with full config
  try {
    const config = [
      {
        initDataTypes: ['skd'],
        videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }],
        audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"' }],
        distinctiveIdentifier: 'required' as MediaKeysRequirement,
        persistentState: 'required' as MediaKeysRequirement,
      },
    ];

    await navigator.requestMediaKeySystemAccess(KeySystem.FAIRPLAY, config);
    return true;
  } catch (error) {
    // Try with minimal config
    try {
      const config = [
        {
          initDataTypes: ['skd'],
          videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }],
        },
      ];

      await navigator.requestMediaKeySystemAccess(KeySystem.FAIRPLAY, config);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Detect PlayReady security level
 */
async function detectPlayReadySecurityLevel(): Promise<string | null> {
  const playreadyVariants = [
    'com.microsoft.playready.recommendation.3000',
    'com.microsoft.playready.recommendation',
    'com.microsoft.playready',
  ];

  for (const variant of playreadyVariants) {
    try {
      const config = [
        {
          initDataTypes: ['cenc'],
          videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }],
        },
      ];

      await navigator.requestMediaKeySystemAccess(variant, config);
      return variant;
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Check if EME is supported
 */
function isEMESupported(): boolean {
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
 * Generate recommendations based on detection results
 */
function generateRecommendations(
  supportedDRMs: DRMType[],
  platform: PlatformInfo,
  browser: BrowserInfo,
  security: SecurityCapabilities
): string[] {
  const recommendations: string[] = [];

  if (supportedDRMs.length === 0) {
    recommendations.push('No DRM systems supported - check browser compatibility');
    recommendations.push('Consider updating browser or using a supported browser');
    return recommendations;
  }

  if (platform.isAppleEcosystem && browser.name === 'Safari') {
    if (supportedDRMs.includes('fairplay')) {
      recommendations.push('FairPlay is optimal for Safari on Apple devices');
    } else {
      recommendations.push('FairPlay should be available on Safari - check configuration');
    }
  } else {
    if (supportedDRMs.includes('widevine')) {
      recommendations.push('Widevine provides best cross-platform compatibility');

      if (security.widevineSecurityLevel === 'L1') {
        recommendations.push('Hardware-backed security (L1) available for enhanced protection');
      } else if (security.widevineSecurityLevel === 'L3') {
        recommendations.push('Software-only security (L3) - consider hardware upgrade for L1');
      }
    }
  }

  if (security.hardwareSecurityAvailable) {
    recommendations.push('Hardware security available - recommended for high-value content');
  } else {
    recommendations.push('Software-only security - suitable for standard content protection');
  }

  if (supportedDRMs.length > 1) {
    recommendations.push('Multiple DRM systems supported - consider multi-DRM strategy');
  }

  return recommendations;
}

/**
 * Create result for unsupported environments
 */
function createUnsupportedResult(
  browser: BrowserInfo,
  platform: PlatformInfo,
  reason: string
): DRMDetectionResult {
  return {
    primaryDRM: 'none',
    supportedDRMs: [],
    browser,
    platform,
    security: {
      hardwareSecurityAvailable: false,
      widevineSecurityLevel: 'unknown',
      playreadySecurityLevel: null,
      fairplayAvailable: false,
    },
    recommendations: [
      `DRM not supported: ${reason}`,
      'Update to a modern browser with EME support',
      'Supported browsers: Chrome, Firefox, Safari, Edge',
    ],
  };
}

/**
 * Quick DRM type detection for simple use cases
 */
export async function detectDRMType(): Promise<DRMType> {
  const result = await detectOptimalDRM();
  return result.primaryDRM;
}

/**
 * Check if a specific DRM type is supported
 */
export async function isDRMTypeSupported(drmType: DRMType): Promise<boolean> {
  const result = await detectOptimalDRM();
  return result.supportedDRMs.includes(drmType);
}
