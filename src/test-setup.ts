/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';

// Extend the existing JSDOM environment with additional mocks
Object.assign(global.window, {
  shaka: {
    Player: {
      isBrowserSupported: () => true,
    },
    polyfill: {
      installAll: () => {},
    },
    net: {
      NetworkingEngine: {
        RequestType: {
          LICENSE: 'license',
        },
      },
    },
  },
});

// Enhance navigator with additional properties
Object.assign(global.navigator, {
  requestMediaKeySystemAccess: vi
    .fn()
    .mockImplementation(async (keySystem: string, _config: any[]) => {
      // Mock implementation
      if (keySystem === 'com.widevine.alpha') {
        return {
          keySystem,
          createMediaKeys: async () => ({}),
        };
      }
      throw new Error('Unsupported key system');
    }),
});

// Mock MediaKeys (only if not already defined by JSDOM)
if (!global.MediaKeys) {
  global.MediaKeys = class {} as any;
}
if (!global.MediaKeySystemAccess) {
  global.MediaKeySystemAccess = class {} as any;
}
