/**
 * Simplified error system for Cloakscreen
 * Single source of truth for all error handling
 */

// Primary exports - unified error system
export {
  CloakscreenError,
  ErrorCode,
  ErrorCategory,
  ErrorFactory,
  ErrorHandler,
} from './simplified';
export type { ErrorContext } from './simplified';

// Re-export HardwareAccelerationError
export { HardwareAccelerationError } from './HardwareAccelerationError';
