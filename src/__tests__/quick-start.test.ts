/**
 * Quick-start API tests
 */

import { protect } from '../quick-start';
import { vi } from 'vitest';

// Mock Cloakscreen
vi.mock('../core/Cloakscreen', () => ({
  Cloakscreen: vi.fn(),
}));
import { Cloakscreen } from '../core/Cloakscreen';
const MockCloakscreen = Cloakscreen as any;

describe('Quick-start API', () => {
  let mockElement: HTMLElement;
  let mockCloakscreen: any;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.id = 'test-element';
    document.body.appendChild(mockElement);

    mockCloakscreen = {
      protect: vi.fn().mockResolvedValue(undefined),
      unprotect: vi.fn(),
      updateContent: vi.fn(),
      getContent: vi.fn().mockReturnValue('test content'),
      isProtected: vi.fn().mockReturnValue(false),
      getDRMStatus: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as any;

    MockCloakscreen.mockImplementation(() => mockCloakscreen);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    vi.clearAllMocks();
  });

  describe('protect function', () => {
    test('should protect with demo provider by default', async () => {
      const result = await protect('#test-element');

      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        provider: {
          name: 'pallycon',
          config: expect.objectContaining({
            siteId: 'CVW9',
            tokenEndpoint: '/api/get-license-token',
          }),
        },
        options: {
          fallbackMode: 'blur',
          debug: false,
        },
      });
      expect(mockCloakscreen.protect).toHaveBeenCalled();
      expect(result).toBe(mockCloakscreen);
    });

    test('should protect with cloud provider', async () => {
      const result = await protect('#test-element', {
        provider: 'cloud',
        apiKey: 'test-api-key',
      });

      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        provider: {
          name: 'pallycon',
          config: {
            siteId: 'CLOUD',
            tokenEndpoint: 'https://cloud.cloakscreen.tech/api/license-token?key=test-api-key',
          },
        },
        options: {
          fallbackMode: 'blur',
          debug: false,
        },
      });
      expect(result).toBe(mockCloakscreen);
    });

    test('should protect with self-hosted provider', async () => {
      const result = await protect('#test-element', {
        provider: 'self-hosted',
        siteId: 'TEST_SITE_ID',
        tokenEndpoint: '/custom/endpoint',
      });

      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        provider: {
          name: 'pallycon',
          config: {
            siteId: 'TEST_SITE_ID',
            tokenEndpoint: '/custom/endpoint',
          },
        },
        options: {
          fallbackMode: 'blur',
          debug: false,
        },
      });
      expect(result).toBe(mockCloakscreen);
    });

    test('should use custom config when provided', async () => {
      const customConfig = {
        provider: {
          name: 'pallycon' as const,
          config: {
            siteId: 'CUSTOM',
            tokenEndpoint: '/custom',
          },
        },
        options: {
          fallbackMode: 'hide' as const,
          debug: true,
        },
      };

      const result = await protect('#test-element', {
        config: customConfig,
      });

      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        ...customConfig,
      });
      expect(result).toBe(mockCloakscreen);
    });

    test('should handle HTMLElement input', async () => {
      const result = await protect(mockElement, {
        provider: 'demo',
        debug: true,
      });

      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: mockElement,
        provider: {
          name: 'pallycon',
          config: expect.objectContaining({
            siteId: 'CVW9',
            tokenEndpoint: '/api/get-license-token',
          }),
        },
        options: {
          fallbackMode: 'blur',
          debug: true,
        },
      });
      expect(result).toBe(mockCloakscreen);
    });

    test('should apply custom fallback and debug options', async () => {
      const result = await protect('#test-element', {
        provider: 'demo',
        fallback: 'hide',
        debug: true,
      });

      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        provider: {
          name: 'pallycon',
          config: expect.objectContaining({
            siteId: 'CVW9',
            tokenEndpoint: '/api/get-license-token',
          }),
        },
        options: {
          fallbackMode: 'hide',
          debug: true,
        },
      });
      expect(result).toBe(mockCloakscreen);
    });

    test('should require apiKey for cloud provider', async () => {
      const result = await protect('#test-element', {
        provider: 'cloud',
        // Missing apiKey
      });

      // Should fall back to demo mode
      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        provider: {
          name: 'pallycon',
          config: expect.objectContaining({
            siteId: 'CVW9',
            tokenEndpoint: '/api/get-license-token',
          }),
        },
        options: {
          fallbackMode: 'blur',
          debug: false,
        },
      });
      expect(result).toBe(mockCloakscreen);
    });

    test('should require siteId for self-hosted provider', async () => {
      const result = await protect('#test-element', {
        provider: 'self-hosted',
        // Missing siteId
      });

      // Should fall back to demo mode
      expect(MockCloakscreen).toHaveBeenCalledWith({
        element: '#test-element',
        provider: {
          name: 'pallycon',
          config: expect.objectContaining({
            siteId: 'CVW9',
            tokenEndpoint: '/api/get-license-token',
          }),
        },
        options: {
          fallbackMode: 'blur',
          debug: false,
        },
      });
      expect(result).toBe(mockCloakscreen);
    });
  });
});
