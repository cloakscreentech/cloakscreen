/**
 * Provider tests
 */

import { createProvider, Providers, PallyConProvider, DRMProvider } from '../providers';

describe('Provider Factory', () => {
  test('should throw error when creating provider from string without config', () => {
    expect(() => {
      createProvider('pallycon');
    }).toThrow('Provider preset "pallycon" requires explicit configuration');
  });

  test('should create provider from config object', () => {
    const provider = createProvider({
      name: 'pallycon',
      siteId: 'TEST123',
      tokenEndpoint: '/api/token',
      licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
    });

    expect(provider).toBeInstanceOf(PallyConProvider);
  });

  test('should throw on invalid provider name', () => {
    expect(() => {
      createProvider('invalid-provider' as any);
    }).toThrow();
  });
});

describe('Provider Configuration', () => {
  test('should create PallyCon provider', () => {
    const provider = createProvider({
      name: 'pallycon',
      siteId: 'TEST123',
      tokenEndpoint: '/api/token',
      licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
    });
    expect(provider).toBeInstanceOf(PallyConProvider);
  });

  test('should create PallyCon provider with custom config', () => {
    const provider = createProvider({
      name: 'pallycon',
      siteId: 'TEST123',
      tokenEndpoint: '/custom/endpoint',
      licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
    });

    expect(provider).toBeInstanceOf(PallyConProvider);
    expect((provider as any).pallyConConfig.siteId).toBe('TEST123');
    expect((provider as any).pallyConConfig.tokenEndpoint).toBe('/custom/endpoint');
  });

  test('should create PallyCon cloud provider', () => {
    const provider = createProvider({
      name: 'pallycon',
      siteId: 'TEST123',
      tokenEndpoint: 'https://cloud.cloakscreen.com/api/license-token',
    });
    expect(provider).toBeInstanceOf(PallyConProvider);
    expect((provider as any).pallyConConfig.siteId).toBe('TEST123');
    expect((provider as any).pallyConConfig.tokenEndpoint).toContain('cloud.cloakscreen.com');
  });

  test('should create custom provider', () => {
    class CustomProvider extends DRMProvider {
      constructor(config: any) {
        super(config);
      }

      async initialize() {
        return Promise.resolve();
      }
      async getLicenseToken() {
        return 'token';
      }
      getLicenseServerUrl() {
        return 'url';
      }
      async getContentUrl() {
        return 'url';
      }
      configurePlayer() {}
      destroy() {}
      getCapabilities() {
        return {
          keySystems: [],
          securityLevels: [],
          features: [],
        };
      }
      validateConfig() {}
      async getHealthStatus() {
        return {
          status: 'healthy' as const,
          timestamp: new Date(),
          details: {},
        };
      }
      static getMetadata() {
        return {
          name: 'custom',
          displayName: 'Custom Provider',
          description: 'Test provider',
          supportedKeySystems: [],
          requiredConfig: [],
          optionalConfig: [],
          defaults: {
            licenseServer: 'https://custom-license-server.com',
            requiredFields: [],
            optionalFields: [],
          },
        };
      }
    }

    const customImpl = new CustomProvider({});
    // Custom providers are now created directly, not through Providers.Custom
    expect(customImpl).toBeInstanceOf(CustomProvider);
  });
});
