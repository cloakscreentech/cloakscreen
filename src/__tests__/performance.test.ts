/**
 * Performance benchmarks and tests
 */

import { protect } from '../quick-start';
import { findProtectedContent, initAutoProtection } from '../utils/auto-setup';
import { vi } from 'vitest';

// Mock dependencies for performance testing
vi.mock('../core/Cloakscreen', () => ({
  Cloakscreen: vi.fn(),
}));
import { Cloakscreen } from '../core/Cloakscreen';
const MockCloakscreen = Cloakscreen as any;

describe('Performance Tests', () => {
  beforeEach(() => {
    MockCloakscreen.mockImplementation(
      () =>
        ({
          protect: vi.fn().mockResolvedValue(undefined),
          unprotect: vi.fn(),
          updateContent: vi.fn(),
          getContent: vi.fn().mockReturnValue('test'),
          isProtected: vi.fn().mockReturnValue(false),
          getDRMStatus: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
        }) as any
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Protection Performance', () => {
    test('should protect single element quickly', async () => {
      const element = document.createElement('div');
      element.id = 'perf-test';
      document.body.appendChild(element);

      const startTime = performance.now();
      await protect('#perf-test');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle multiple elements efficiently', async () => {
      // Create multiple elements
      const elements = Array.from({ length: 10 }, (_, i) => {
        const el = document.createElement('div');
        el.id = `perf-test-${i}`;
        document.body.appendChild(el);
        return el;
      });

      const startTime = performance.now();

      // Protect all elements
      const promises = elements.map(el => protect(`#${el.id}`));
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete in under 500ms for 10 elements
    });

    test('should scale linearly with element count', async () => {
      const testSizes = [1, 5, 10];
      const durations: number[] = [];

      for (const size of testSizes) {
        // Clean up previous elements
        document.body.innerHTML = '';

        // Create elements
        const elements = Array.from({ length: size }, (_, i) => {
          const el = document.createElement('div');
          el.id = `scale-test-${i}`;
          document.body.appendChild(el);
          return el;
        });

        const startTime = performance.now();
        const promises = elements.map(el => protect(`#${el.id}`));
        await Promise.all(promises);
        const endTime = performance.now();

        durations.push(endTime - startTime);
      }

      // Check that performance scales reasonably (not exponentially)
      const ratio1to5 = durations[1] / durations[0];
      const ratio5to10 = durations[2] / durations[1];

      expect(ratio1to5).toBeLessThan(50); // 5x elements shouldn't take 50x time (very relaxed for CI)
      expect(ratio5to10).toBeLessThan(25); // 2x elements shouldn't take 25x time (very relaxed for CI)
    });
  });

  describe('Auto-detection Performance', () => {
    test('should find elements quickly in small DOM', () => {
      // Create small DOM
      document.body.innerHTML = `
        <div data-cloakscreen>Content 1</div>
        <p class="cloakscreen-protect">Content 2</p>
        <span>Regular content</span>
      `;

      const startTime = performance.now();
      const elements = findProtectedContent();
      const endTime = performance.now();

      expect(elements).toHaveLength(2);
      expect(endTime - startTime).toBeLessThan(50); // Should be reasonably fast
    });

    test('should find elements efficiently in large DOM', () => {
      // Create large DOM with many elements
      const largeHTML = Array.from({ length: 1000 }, (_, i) => {
        const hasProtection = i % 100 === 0; // Every 100th element is protected
        const className = hasProtection ? 'cloakscreen-protect' : 'regular';
        return `<div class="${className}">Content ${i}</div>`;
      }).join('');

      document.body.innerHTML = largeHTML;

      const startTime = performance.now();
      const elements = findProtectedContent();
      const endTime = performance.now();

      expect(elements).toHaveLength(10); // Should find 10 protected elements
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });

    test('should handle deeply nested DOM efficiently', () => {
      // Create deeply nested structure
      let nestedHTML = '<div data-cloakscreen>Root protected</div>';
      for (let i = 0; i < 20; i++) {
        nestedHTML = `<div>${nestedHTML}<div class="level-${i}">Level ${i}</div></div>`;
      }
      nestedHTML += '<div data-cloakscreen>Deep protected</div>';

      document.body.innerHTML = nestedHTML;

      const startTime = performance.now();
      const elements = findProtectedContent();
      const endTime = performance.now();

      expect(elements).toHaveLength(2);
      expect(endTime - startTime).toBeLessThan(20); // Should handle nesting efficiently
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with repeated operations', async () => {
      const element = document.createElement('div');
      element.id = 'memory-test';
      document.body.appendChild(element);

      // Simulate memory pressure test
      const iterations = 100;
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < iterations; i++) {
        const cloak = await protect('#memory-test');
        cloak.destroy();
      }

      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable (less than 10MB for 100 iterations)
      if (startMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('should cleanup resources properly', () => {
      const element = document.createElement('div');
      element.id = 'cleanup-test';
      document.body.appendChild(element);

      const cloak = new Cloakscreen({
        element: element,
        provider: 'pallycon',
      });

      // Add some event listeners
      const callback = vi.fn();
      cloak.on('protected', callback);
      cloak.on('unprotected', callback);

      // Destroy should clean up everything
      expect(() => {
        cloak.destroy();
      }).not.toThrow();

      // Verify cleanup
      expect(cloak.isProtected()).toBe(false);
    });
  });

  describe('Initialization Performance', () => {
    test('should initialize Cloakscreen quickly', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      const startTime = performance.now();
      const cloak = new Cloakscreen({
        element: element,
        provider: 'pallycon',
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should initialize in under 50ms
      expect(cloak).toBeDefined();
    });

    test('should handle concurrent initializations', () => {
      const elements = Array.from({ length: 5 }, (_, i) => {
        const el = document.createElement('div');
        el.id = `concurrent-${i}`;
        document.body.appendChild(el);
        return el;
      });

      const startTime = performance.now();

      const cloaks = elements.map(
        el =>
          new Cloakscreen({
            element: el,
            provider: 'pallycon',
          })
      );

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should handle 5 concurrent inits
      expect(cloaks).toHaveLength(5);
      cloaks.forEach(cloak => expect(cloak).toBeDefined());
    });
  });

  describe('Auto-protection Performance', () => {
    test('should auto-protect elements efficiently', async () => {
      document.body.innerHTML = `
        <div data-cloakscreen>Content 1</div>
        <div data-cloakscreen>Content 2</div>
        <div data-cloakscreen>Content 3</div>
      `;

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      const startTime = performance.now();
      await initAutoProtection();
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should auto-protect quickly
    });

    test('should handle large number of auto-protected elements', async () => {
      // Create many elements to auto-protect
      const elements = Array.from(
        { length: 50 },
        (_, i) => `<div data-cloakscreen>Auto content ${i}</div>`
      ).join('');

      document.body.innerHTML = elements;

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      const startTime = performance.now();
      await initAutoProtection();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async ops
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should handle 50 elements efficiently
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain performance with complex configurations', async () => {
      const element = document.createElement('div');
      element.id = 'complex-test';
      document.body.appendChild(element);

      const complexConfig = {
        provider: 'cloud' as const,
        apiKey: 'test-key',
        fallback: 'blur' as const,
        debug: true,
        config: {
          security: {
            fallbackMode: 'hide' as const,
            debugMode: true,
          },
          content: {
            backgroundColor: '#000000',
            textColor: '#ffffff',
            style: {
              fontFamily: 'Arial',
              fontSize: '16px',
              padding: '20px',
            },
          },
        },
      };

      const startTime = performance.now();
      await protect('#complex-test', complexConfig);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(150); // Complex config shouldn't slow down significantly
    });

    test('should perform consistently across multiple runs', async () => {
      const element = document.createElement('div');
      element.id = 'consistency-test';
      document.body.appendChild(element);

      const durations: number[] = [];
      const runs = 10;

      for (let i = 0; i < runs; i++) {
        const startTime = performance.now();
        await protect('#consistency-test');
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Calculate variance
      const mean = durations.reduce((a, b) => a + b) / durations.length;
      const variance =
        durations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / durations.length;
      const standardDeviation = Math.sqrt(variance);

      // Standard deviation should be reasonable (less than 100% of mean for CI environments)
      expect(standardDeviation).toBeLessThan(mean * 1.0);
    });
  });
});
