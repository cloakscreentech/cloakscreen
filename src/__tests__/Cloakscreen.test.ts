/**
 * Cloakscreen tests
 */

import { Cloakscreen } from '../core/Cloakscreen';

describe('Cloakscreen', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.innerHTML = '<p>Test content</p>';
  });

  test('should create instance with basic config', () => {
    const cloak = new Cloakscreen({
      element: mockElement,
      provider: {
        name: 'pallycon',
        config: {
          siteId: 'TEST123',
          tokenEndpoint: '/api/token',
        },
      },
    });

    expect(cloak).toBeInstanceOf(Cloakscreen);
  });

  test('should create instance with auto-detection config', () => {
    const cloak = new Cloakscreen({
      element: mockElement,
      provider: {
        name: 'pallycon',
        siteId: 'TEST123',
        tokenEndpoint: '/api/token',
      },
    });

    expect(cloak).toBeInstanceOf(Cloakscreen);
  });

  test('should throw error with invalid element', () => {
    expect(() => {
      new Cloakscreen({
        element: null as any,
        provider: 'pallycon',
      });
    }).toThrow();
  });

  test('should throw error with invalid provider', () => {
    expect(() => {
      new Cloakscreen({
        element: mockElement,
        provider: 'invalid-provider' as any,
      });
    }).toThrow();
  });
});
