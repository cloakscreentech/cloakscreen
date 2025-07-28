/**
 * Auto-setup tests
 */

import { findProtectedContent, initAutoProtection } from '../utils/auto-setup';

import { vi } from 'vitest';

// Mock the protect function
vi.mock('../quick-start', () => ({
  protect: vi.fn().mockResolvedValue({}),
}));

import { protect } from '../quick-start';
const mockProtect = protect as any;

describe('Auto-setup utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('findProtectedContent', () => {
    test('should find elements with data-cloakscreen attribute', () => {
      document.body.innerHTML = `
        <div data-cloakscreen>Content 1</div>
        <p data-cloakscreen>Content 2</p>
        <span>Not protected</span>
      `;

      const elements = findProtectedContent();
      expect(elements).toHaveLength(2);
      expect(elements[0].tagName).toBe('DIV');
      expect(elements[1].tagName).toBe('P');
    });

    test('should find elements with cloakscreen-protect class', () => {
      document.body.innerHTML = `
        <div class="cloakscreen-protect">Content 1</div>
        <p class="other-class cloakscreen-protect">Content 2</p>
        <span class="other-class">Not protected</span>
      `;

      const elements = findProtectedContent();
      expect(elements).toHaveLength(2);
      expect(elements[0].classList.contains('cloakscreen-protect')).toBe(true);
      expect(elements[1].classList.contains('cloakscreen-protect')).toBe(true);
    });

    test('should assign IDs to elements without them', () => {
      document.body.innerHTML = `
        <div data-cloakscreen>No ID</div>
        <p id="existing-id" data-cloakscreen>Has ID</p>
      `;

      const elements = findProtectedContent();
      expect(elements).toHaveLength(2);
      expect(elements[0].id).toMatch(/^cloakscreen-/);
      expect(elements[1].id).toBe('existing-id');
    });

    test('should return empty array when no protected content found', () => {
      document.body.innerHTML = `
        <div>Regular content</div>
        <p class="other-class">More content</p>
      `;

      const elements = findProtectedContent();
      expect(elements).toHaveLength(0);
    });
  });

  describe('initAutoProtection', () => {
    test('should protect found elements with default config', async () => {
      document.body.innerHTML = `
        <div data-cloakscreen>Content 1</div>
        <p class="cloakscreen-protect">Content 2</p>
      `;

      // Mock DOM ready state
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      await initAutoProtection();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProtect).toHaveBeenCalledTimes(2);
      expect(mockProtect).toHaveBeenCalledWith(expect.any(HTMLElement), {
        provider: 'demo',
        fallback: 'blur',
        debug: false,
      });
    });

    test('should use custom config when provided', async () => {
      document.body.innerHTML = `<div data-cloakscreen>Content</div>`;

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      const customConfig = {
        provider: 'cloud' as const,
        apiKey: 'test-key',
        fallback: 'hide' as const,
        debug: true,
      };

      await initAutoProtection(customConfig);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProtect).toHaveBeenCalledWith(expect.any(HTMLElement), customConfig);
    });

    test('should wait for DOM ready if loading', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
      });

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      initAutoProtection();

      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    test('should handle no protected elements gracefully', async () => {
      document.body.innerHTML = `<div>Regular content</div>`;

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await initAutoProtection();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Debug messages are not shown in test environment (log level is WARN)
      // This is expected behavior - no console output for debug level
      expect(mockProtect).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should handle protection errors gracefully', async () => {
      document.body.innerHTML = `<div data-cloakscreen>Content</div>`;

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      mockProtect.mockRejectedValueOnce(new Error('Protection failed'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      await initAutoProtection();
      await new Promise(resolve => setTimeout(resolve, 0));

      // With silent logging by default, no console output is expected
      // This is the correct behavior for an NPM library
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    test('should return early in non-browser environment', () => {
      const originalWindow = global.window;
      const originalDocument = global.document;

      // @ts-ignore
      delete global.window;
      // @ts-ignore
      delete global.document;

      initAutoProtection();

      expect(mockProtect).not.toHaveBeenCalled();

      global.window = originalWindow;
      global.document = originalDocument;
    });
  });
});
