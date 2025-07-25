/**
 * Error Codes and Categories
 *
 * Standardized error codes for consistent error handling across the codebase.
 * Each error has a unique code, category, and severity level.
 */

/**
 * Error categories for grouping related errors
 */
export enum ErrorCategory {
  // Core functionality errors
  CONFIGURATION = 'configuration',
  INITIALIZATION = 'initialization',
  CONTENT = 'content',

  // DRM and security errors
  DRM = 'drm',
  SECURITY = 'security',
  ENCRYPTION = 'encryption',

  // Browser and compatibility errors
  COMPATIBILITY = 'compatibility',
  HARDWARE = 'hardware',
  BROWSER = 'browser',

  // Network and external service errors
  NETWORK = 'network',
  PROVIDER = 'provider',
  LICENSE = 'license',

  // Development and validation errors
  VALIDATION = 'validation',
  DEVELOPMENT = 'development',

  // System and runtime errors
  SYSTEM = 'system',
  RUNTIME = 'runtime',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low', // Warning, doesn't break functionality
  MEDIUM = 'medium', // Error, but has fallback/recovery
  HIGH = 'high', // Critical error, breaks core functionality
  CRITICAL = 'critical', // Fatal error, complete failure
}

/**
 * Standardized error codes
 */
export enum ErrorCode {
  // Configuration Errors (1000-1099)
  INVALID_CONFIG = 'CS1001',
  MISSING_REQUIRED_CONFIG = 'CS1002',
  INVALID_PROVIDER_CONFIG = 'CS1003',
  CONFIG_VALIDATION_FAILED = 'CS1004',

  // Initialization Errors (1100-1199)
  INITIALIZATION_FAILED = 'CS1101',
  PROVIDER_INIT_FAILED = 'CS1102',
  DEPENDENCIES_MISSING = 'CS1103',
  SETUP_INCOMPLETE = 'CS1104',

  // Content Errors (1200-1299)
  CONTENT_NOT_FOUND = 'CS1201',
  INVALID_CONTENT_TYPE = 'CS1202',
  CONTENT_LOAD_FAILED = 'CS1203',
  CONTENT_ALREADY_PROTECTED = 'CS1204',
  CONTENT_NOT_PROTECTED = 'CS1205',

  // DRM Errors (1300-1399)
  DRM_NOT_SUPPORTED = 'CS1301',
  DRM_INIT_FAILED = 'CS1302',
  KEY_SYSTEM_UNAVAILABLE = 'CS1303',
  LICENSE_REQUEST_FAILED = 'CS1304',
  LICENSE_INVALID = 'CS1305',
  DRM_SESSION_FAILED = 'CS1306',

  // Security Errors (1400-1499)
  SECURITY_VIOLATION = 'CS1401',
  TAMPER_DETECTED = 'CS1402',
  UNAUTHORIZED_ACCESS = 'CS1403',
  SECURITY_CHECK_FAILED = 'CS1404',

  // Hardware/Compatibility Errors (1500-1599)
  HARDWARE_ACCELERATION_MISSING = 'CS1501',
  BROWSER_NOT_SUPPORTED = 'CS1502',
  FEATURE_NOT_AVAILABLE = 'CS1503',
  GPU_NOT_DETECTED = 'CS1504',

  // Network/Provider Errors (1600-1699)
  NETWORK_ERROR = 'CS1601',
  PROVIDER_UNAVAILABLE = 'CS1602',
  TOKEN_GENERATION_FAILED = 'CS1603',
  API_REQUEST_FAILED = 'CS1604',
  TIMEOUT_ERROR = 'CS1605',

  // Validation Errors (1700-1799)
  VALIDATION_ERROR = 'CS1701',
  INVALID_INPUT = 'CS1702',
  TYPE_MISMATCH = 'CS1703',
  CONSTRAINT_VIOLATION = 'CS1704',

  // System/Runtime Errors (1800-1899)
  RUNTIME_ERROR = 'CS1801',
  MEMORY_ERROR = 'CS1802',
  RESOURCE_UNAVAILABLE = 'CS1803',
  OPERATION_FAILED = 'CS1804',

  // Development Errors (1900-1999)
  NOT_IMPLEMENTED = 'CS1901',
  DEPRECATED_FEATURE = 'CS1902',
  DEVELOPMENT_ERROR = 'CS1903',
}

/**
 * Error metadata interface
 */
export interface ErrorMetadata {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  description: string;
  recoverable: boolean;
  userMessage?: string;
  helpUrl?: string;
  troubleshooting?: string[];
}

/**
 * Complete error definitions with metadata
 */
export const ERROR_DEFINITIONS: Partial<Record<ErrorCode, ErrorMetadata>> = {
  // Configuration Errors
  [ErrorCode.INVALID_CONFIG]: {
    code: ErrorCode.INVALID_CONFIG,
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.HIGH,
    message: 'Invalid configuration provided',
    description: 'The configuration object contains invalid or malformed data',
    recoverable: true,
    userMessage: 'Please check your configuration settings',
    troubleshooting: [
      'Verify all required fields are present',
      'Check data types match expected values',
    ],
  },

  [ErrorCode.MISSING_REQUIRED_CONFIG]: {
    code: ErrorCode.MISSING_REQUIRED_CONFIG,
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.HIGH,
    message: 'Required configuration missing',
    description: 'One or more required configuration fields are missing',
    recoverable: true,
    userMessage: 'Required configuration is missing',
    troubleshooting: [
      'Check documentation for required fields',
      'Ensure all mandatory settings are provided',
    ],
  },

  // DRM Errors
  [ErrorCode.DRM_NOT_SUPPORTED]: {
    code: ErrorCode.DRM_NOT_SUPPORTED,
    category: ErrorCategory.DRM,
    severity: ErrorSeverity.CRITICAL,
    message: 'DRM not supported in this environment',
    description: 'The current browser or environment does not support DRM functionality',
    recoverable: false,
    userMessage: 'Your browser does not support content protection',
    troubleshooting: ['Use a modern browser with DRM support', 'Enable DRM in browser settings'],
  },

  [ErrorCode.HARDWARE_ACCELERATION_MISSING]: {
    code: ErrorCode.HARDWARE_ACCELERATION_MISSING,
    category: ErrorCategory.HARDWARE,
    severity: ErrorSeverity.MEDIUM,
    message: 'Hardware acceleration not available',
    description: 'Hardware acceleration is required for optimal DRM security but is not available',
    recoverable: true,
    userMessage: 'Hardware acceleration is recommended for better security',
    troubleshooting: ['Enable hardware acceleration in browser', 'Update graphics drivers'],
  },

  [ErrorCode.INVALID_PROVIDER_CONFIG]: {
    code: ErrorCode.INVALID_PROVIDER_CONFIG,
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.HIGH,
    message: 'Invalid provider configuration',
    description: 'Provider-specific configuration is invalid or incomplete',
    recoverable: true,
    userMessage: 'Provider configuration is invalid',
    troubleshooting: ['Check provider documentation', 'Verify required fields'],
  },

  [ErrorCode.CONFIG_VALIDATION_FAILED]: {
    code: ErrorCode.CONFIG_VALIDATION_FAILED,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.HIGH,
    message: 'Configuration validation failed',
    description: 'Configuration failed validation checks',
    recoverable: true,
    userMessage: 'Configuration is invalid',
    troubleshooting: ['Check configuration format', 'Verify all required fields'],
  },

  [ErrorCode.RUNTIME_ERROR]: {
    code: ErrorCode.RUNTIME_ERROR,
    category: ErrorCategory.RUNTIME,
    severity: ErrorSeverity.MEDIUM,
    message: 'Runtime error occurred',
    description: 'An unexpected error occurred during runtime execution',
    recoverable: true,
    userMessage: 'An unexpected error occurred',
    troubleshooting: ['Try refreshing the page', 'Check browser console for details'],
  },
};

/**
 * Get error metadata by code
 */
export function getErrorMetadata(code: ErrorCode): ErrorMetadata {
  return (
    ERROR_DEFINITIONS[code] ||
    ERROR_DEFINITIONS[ErrorCode.RUNTIME_ERROR] || {
      code: ErrorCode.RUNTIME_ERROR,
      category: ErrorCategory.RUNTIME,
      severity: ErrorSeverity.MEDIUM,
      message: 'Unknown error occurred',
      description: 'An unknown error occurred',
      recoverable: true,
      userMessage: 'An error occurred',
      troubleshooting: ['Try again', 'Check browser console for details'],
    }
  );
}
