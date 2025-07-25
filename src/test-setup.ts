/**
 * Test setup file for Jest
 */

// Mock browser globals
global.window = {
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
} as any;

global.navigator = {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  requestMediaKeySystemAccess: async (keySystem: string, _config: any[]) => {
    // Mock implementation
    if (keySystem === 'com.widevine.alpha') {
      return {
        keySystem,
        createMediaKeys: async () => ({}),
      };
    }
    throw new Error('Unsupported key system');
  },
} as any;

global.document = {
  createElement: (tagName: string) => {
    if (tagName === 'video') {
      return {
        setAttribute: () => {},
        style: {},
        play: async () => {},
      };
    }
    return {
      className: '',
      style: {},
      appendChild: () => {},
    };
  },
  querySelector: () => null,
} as any;

// Mock MediaKeys
global.MediaKeys = class {} as any;
global.MediaKeySystemAccess = class {} as any;

// Mock Node
global.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
} as any;
