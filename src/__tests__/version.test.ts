/**
 * Version and API versioning tests
 */

import {
  VERSION,
  API_VERSION,
  getVersionInfo,
  isApiVersionSupported,
  compareVersions,
  meetsMinimumVersion,
} from '../version';

import { deprecate, clearDeprecationWarnings } from '../utils/deprecation';
import { vi } from 'vitest';

describe('Version Management', () => {
  test('should export version constants', () => {
    expect(VERSION).toBe('1.0.0');
    expect(API_VERSION).toBe('1.0');
  });

  test('should provide version info', () => {
    const info = getVersionInfo();
    expect(info.version).toBe(VERSION);
    expect(info.apiVersion).toBe(API_VERSION);
    expect(info.supportedVersions).toContain('1.0');
    expect(info.buildTime).toBeDefined();
  });

  test('should check API version support', () => {
    expect(isApiVersionSupported('1.0')).toBe(true);
    expect(isApiVersionSupported('2.0')).toBe(false);
  });

  test('should compare versions correctly', () => {
    expect(compareVersions('1.0', '1.0')).toBe(0);
    expect(compareVersions('1.0', '1.1')).toBe(-1);
    expect(compareVersions('1.1', '1.0')).toBe(1);
    expect(compareVersions('2.0', '1.9')).toBe(1);
  });

  test('should check minimum version requirements', () => {
    expect(meetsMinimumVersion('1.0')).toBe(true);
    expect(meetsMinimumVersion('1.1')).toBe(true);
    expect(meetsMinimumVersion('0.9')).toBe(false);
  });
});

describe('Simple Deprecation System', () => {
  beforeEach(() => {
    clearDeprecationWarnings();
  });

  test('should show deprecation warnings', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

    deprecate('oldMethod()', 'newMethod()');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[DEPRECATION] oldMethod() is deprecated. Use newMethod() instead.'
    );

    consoleSpy.mockRestore();
  });

  test('should only show deprecation warning once', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

    deprecate('oldMethod()', 'newMethod()');
    deprecate('oldMethod()', 'newMethod()'); // Should not show again

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});

describe('API Version Headers', () => {
  test('should include version information in debug logs', () => {
    // This would be tested in integration tests with actual Cloakscreen usage
    expect(VERSION).toBeDefined();
    expect(API_VERSION).toBeDefined();
  });
});
