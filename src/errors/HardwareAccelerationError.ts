/**
 * Hardware Acceleration Error
 *
 * Specialized error for hardware acceleration failures
 * Now uses the simplified error system
 */

import { ErrorFactory } from './simplified';

/**
 * @deprecated Use ErrorFactory.hardwareAcceleration() instead
 */
export class HardwareAccelerationError extends Error {
  constructor(message: string, _suggestions: string[] = []) {
    super(message);
    this.name = 'HardwareAccelerationError';
  }

  static notAvailable(failureReasons: string[]) {
    return ErrorFactory.hardwareAcceleration(
      'Hardware acceleration is required for DRM content protection but is not available',
      failureReasons
    );
  }

  static webglFailed() {
    return ErrorFactory.hardwareAcceleration('WebGL hardware acceleration test failed', [
      'WebGL test failed',
    ]);
  }

  static softwareRendering(renderer: string) {
    return ErrorFactory.hardwareAcceleration(`Software rendering detected: ${renderer}`, [
      `Software renderer: ${renderer}`,
    ]);
  }
}
