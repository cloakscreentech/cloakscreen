/**
 * Tests for enhanced DRM detection system
 */

import {
  detectOptimalDRM,
  detectDRMType,
  isDRMTypeSupported,
  DRMDetectionResult,
  DRMType,
} from '../utils/drm-detection';

// Mock navigator and window for testing
const mockNavigator = {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'Win32',
  requestMediaKeySystemAccess: jest.fn(),
};

const mockWindow = {
  MediaKeys: class MockMediaKeys {},
  MediaKeySystemAccess: class MockMediaKeySystemAccess {},
  WebKitMediaKeys: undefined,
};

// Setup global mocks
(global as any).navigator = mockNavigator;
(global as any).window = mockWindow;

describe('Enhanced DRM Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectOptimalDRM', () => {
    it('should detect Widevine on Chrome Windows', async () => {
      // Mock successful Widevine detection
      mockNavigator.requestMediaKeySystemAccess.mockImplementation(keySystem => {
        if (keySystem === 'com.widevine.alpha') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();

      expect(result.primaryDRM).toBe('widevine');
      expect(result.supportedDRMs).toContain('widevine');
      expect(result.browser.name).toBe('Chrome');
      expect(result.platform.os).toBe('Windows');
    });

    it('should detect FairPlay on Safari macOS', async () => {
      // Mock Safari on macOS
      mockNavigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      mockNavigator.platform = 'MacIntel';

      // Mock WebKit FairPlay support
      (global as any).window.WebKitMediaKeys = {
        isTypeSupported: jest.fn().mockReturnValue(true),
      };

      mockNavigator.requestMediaKeySystemAccess.mockImplementation(keySystem => {
        if (keySystem === 'com.apple.fps.1_0') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();

      expect(result.primaryDRM).toBe('fairplay');
      expect(result.supportedDRMs).toContain('fairplay');
      expect(result.browser.name).toBe('Safari');
      expect(result.platform.os).toBe('macOS');
      expect(result.platform.isAppleEcosystem).toBe(true);
    });

    it('should detect PlayReady on Edge Windows', async () => {
      // Mock Edge on Windows
      mockNavigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

      mockNavigator.requestMediaKeySystemAccess.mockImplementation(keySystem => {
        if (keySystem === 'com.microsoft.playready') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();

      expect(result.primaryDRM).toBe('playready');
      expect(result.supportedDRMs).toContain('playready');
      expect(result.browser.name).toBe('Edge');
    });

    it('should return none when no DRM is supported', async () => {
      // Mock no DRM support
      mockNavigator.requestMediaKeySystemAccess.mockRejectedValue(new Error('Not supported'));

      const result = await detectOptimalDRM();

      expect(result.primaryDRM).toBe('none');
      expect(result.supportedDRMs).toHaveLength(0);
      expect(result.recommendations).toContain(
        'No DRM systems supported - check browser compatibility'
      );
    });

    it('should handle EME not supported', async () => {
      // Mock EME not supported
      const originalNavigator = global.navigator;
      (global as any).navigator = {};

      const result = await detectOptimalDRM();

      expect(result.primaryDRM).toBe('none');
      expect(result.recommendations).toContain('DRM not supported: EME not supported');

      // Restore navigator
      (global as any).navigator = originalNavigator;
    });
  });

  describe('detectDRMType', () => {
    it('should return the primary DRM type', async () => {
      mockNavigator.requestMediaKeySystemAccess.mockImplementation(keySystem => {
        if (keySystem === 'com.widevine.alpha') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Not supported'));
      });

      const drmType = await detectDRMType();
      expect(drmType).toBe('widevine');
    });
  });

  describe('isDRMTypeSupported', () => {
    it('should return true for supported DRM type', async () => {
      mockNavigator.requestMediaKeySystemAccess.mockImplementation(keySystem => {
        if (keySystem === 'com.widevine.alpha') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Not supported'));
      });

      const isSupported = await isDRMTypeSupported('widevine');
      expect(isSupported).toBe(true);
    });

    it('should return false for unsupported DRM type', async () => {
      mockNavigator.requestMediaKeySystemAccess.mockRejectedValue(new Error('Not supported'));

      const isSupported = await isDRMTypeSupported('fairplay');
      expect(isSupported).toBe(false);
    });
  });

  describe('Browser Detection', () => {
    it('should detect Chrome correctly', async () => {
      mockNavigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const result = await detectOptimalDRM();
      expect(result.browser.name).toBe('Chrome');
      expect(result.browser.engine).toBe('Chromium');
    });

    it('should detect Firefox correctly', async () => {
      mockNavigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';

      const result = await detectOptimalDRM();
      expect(result.browser.name).toBe('Firefox');
      expect(result.browser.engine).toBe('Gecko');
    });

    it('should detect Safari correctly', async () => {
      mockNavigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

      const result = await detectOptimalDRM();
      expect(result.browser.name).toBe('Safari');
      expect(result.browser.engine).toBe('WebKit');
    });
  });

  describe('Platform Detection', () => {
    it('should detect Windows correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      mockNavigator.platform = 'Win32';

      const result = await detectOptimalDRM();
      expect(result.platform.os).toBe('Windows');
      expect(result.platform.isAppleEcosystem).toBe(false);
    });

    it('should detect macOS correctly', async () => {
      mockNavigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
      mockNavigator.platform = 'MacIntel';

      const result = await detectOptimalDRM();
      expect(result.platform.os).toBe('macOS');
      expect(result.platform.isAppleEcosystem).toBe(true);
    });

    it('should detect iOS correctly', async () => {
      mockNavigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

      const result = await detectOptimalDRM();
      expect(result.platform.os).toBe('iOS');
      expect(result.platform.isAppleEcosystem).toBe(true);
      expect(result.platform.isMobile).toBe(true);
    });

    it('should detect Android correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36';

      const result = await detectOptimalDRM();
      expect(result.platform.os).toBe('Android');
      expect(result.platform.isMobile).toBe(true);
    });
  });

  describe('Security Capabilities', () => {
    it('should detect Widevine L1 security', async () => {
      mockNavigator.requestMediaKeySystemAccess.mockImplementation((keySystem, configs) => {
        if (keySystem === 'com.widevine.alpha') {
          const config = configs[0];
          if (config.videoCapabilities?.[0]?.robustness?.startsWith('HW_SECURE_')) {
            return Promise.resolve({});
          }
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();
      expect(result.security.widevineSecurityLevel).toBe('L1');
      expect(result.security.hardwareSecurityAvailable).toBe(true);
    });

    it('should detect Widevine L3 security', async () => {
      mockNavigator.requestMediaKeySystemAccess.mockImplementation((keySystem, configs) => {
        if (keySystem === 'com.widevine.alpha') {
          const config = configs[0];
          if (config.videoCapabilities?.[0]?.robustness?.startsWith('SW_SECURE_')) {
            return Promise.resolve({});
          }
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();
      expect(result.security.widevineSecurityLevel).toBe('L3');
      expect(result.security.hardwareSecurityAvailable).toBe(false);
    });
  });

  describe('Recommendations', () => {
    it('should provide platform-specific recommendations', async () => {
      // Mock Safari on macOS with FairPlay
      mockNavigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      mockNavigator.platform = 'MacIntel';

      mockNavigator.requestMediaKeySystemAccess.mockImplementation(keySystem => {
        if (keySystem === 'com.apple.fps.1_0') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();
      expect(result.recommendations).toContain('FairPlay is optimal for Safari on Apple devices');
    });

    it('should recommend hardware security when available', async () => {
      mockNavigator.requestMediaKeySystemAccess.mockImplementation((keySystem, configs) => {
        if (keySystem === 'com.widevine.alpha') {
          const config = configs[0];
          if (config.videoCapabilities?.[0]?.robustness?.startsWith('HW_SECURE_')) {
            return Promise.resolve({});
          }
        }
        return Promise.reject(new Error('Not supported'));
      });

      const result = await detectOptimalDRM();
      expect(result.recommendations).toContain(
        'Hardware security available - recommended for high-value content'
      );
    });
  });
});
