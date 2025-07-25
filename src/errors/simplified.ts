/**
 * Simplified Error System for Cloakscreen
 *
 * Replaces the complex error hierarchy with a single, flexible error class
 * and error codes for categorization.
 */

/**
 * Error codes for different types of failures
 */
export enum ErrorCode {
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',

  // DRM errors
  DRM_NOT_SUPPORTED = 'DRM_NOT_SUPPORTED',
  HARDWARE_ACCELERATION_REQUIRED = 'HARDWARE_ACCELERATION_REQUIRED',
  LICENSE_REQUEST_FAILED = 'LICENSE_REQUEST_FAILED',
  PLAYER_INITIALIZATION_FAILED = 'PLAYER_INITIALIZATION_FAILED',
  CONTENT_DECRYPTION_FAILED = 'CONTENT_DECRYPTION_FAILED',

  // Content errors
  CONTENT_LOAD_FAILED = 'CONTENT_LOAD_FAILED',
  CONTENT_NOT_PROTECTED = 'CONTENT_NOT_PROTECTED',
  ADAPTER_INITIALIZATION_FAILED = 'ADAPTER_INITIALIZATION_FAILED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Browser compatibility
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Error categories for grouping related error codes
 */
export enum ErrorCategory {
  CONFIGURATION = 'configuration',
  DRM = 'drm',
  CONTENT = 'content',
  NETWORK = 'network',
  COMPATIBILITY = 'compatibility',
  INTERNAL = 'internal',
}

/**
 * Error context interface for additional error information
 */
export interface ErrorContext {
  /** Component where the error occurred */
  component?: string;
  /** Method where the error occurred */
  method?: string;
  /** Additional details about the error */
  details?: Record<string, unknown>;
  /** Suggested actions for the user */
  suggestions?: string[];
  /** Whether this error is recoverable */
  recoverable?: boolean;
}

/**
 * Simplified Cloakscreen error class
 */
export class CloakscreenError extends Error {
  /** Error code for programmatic handling */
  public readonly code: ErrorCode;

  /** Error category for grouping */
  public readonly category: ErrorCategory;

  /** Additional context about the error */
  public readonly context: ErrorContext;

  /** Timestamp when the error occurred */
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    category: ErrorCategory,
    context: ErrorContext = {}
  ) {
    super(message);

    this.name = 'CloakscreenError';
    this.code = code;
    this.category = category;
    this.context = context;
    this.timestamp = new Date();

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CloakscreenError);
    }
  }

  /**
   * Get a user-friendly error message with suggestions
   */
  getUserMessage(): string {
    let message = this.message;

    if (this.context.suggestions && this.context.suggestions.length > 0) {
      message += '\n\nSuggestions:\n';
      message += this.context.suggestions.map(s => `• ${s}`).join('\n');
    }

    return message;
  }

  /**
   * Get error details for logging/debugging
   */
  getDetails(): Record<string, unknown> {
    return {
      message: this.message,
      code: this.code,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      component: this.context.component,
      method: this.context.method,
      details: this.context.details,
      recoverable: this.context.recoverable,
      stack: this.stack,
    };
  }

  /**
   * Check if this error is recoverable
   */
  isRecoverable(): boolean {
    return this.context.recoverable ?? false;
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

/**
 * Error factory for creating common error types
 */
export class ErrorFactory {
  /**
   * Create a configuration error
   */
  static configuration(
    code: ErrorCode,
    component: string,
    method: string,
    details: Record<string, unknown> = {},
    suggestions: string[] = []
  ): CloakscreenError {
    return new CloakscreenError(
      `Configuration error in ${component}.${method}`,
      code,
      ErrorCategory.CONFIGURATION,
      { component, method, details, suggestions, recoverable: true }
    );
  }

  /**
   * Create a DRM error
   */
  static drm(
    code: ErrorCode,
    message: string,
    component: string = 'DRMManager',
    suggestions: string[] = []
  ): CloakscreenError {
    return new CloakscreenError(message, code, ErrorCategory.DRM, {
      component,
      suggestions,
      recoverable: false,
    });
  }

  /**
   * Create a content error
   */
  static content(
    code: ErrorCode,
    message: string,
    component: string = 'ContentManager',
    suggestions: string[] = []
  ): CloakscreenError {
    return new CloakscreenError(message, code, ErrorCategory.CONTENT, {
      component,
      suggestions,
      recoverable: true,
    });
  }

  /**
   * Create a network error
   */
  static network(
    code: ErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ): CloakscreenError {
    return new CloakscreenError(message, code, ErrorCategory.NETWORK, {
      details,
      suggestions: [
        'Check your internet connection',
        'Verify the server is accessible',
        'Try again in a few moments',
      ],
      recoverable: true,
    });
  }

  /**
   * Create a compatibility error
   */
  static compatibility(
    code: ErrorCode,
    message: string,
    suggestions: string[] = []
  ): CloakscreenError {
    return new CloakscreenError(message, code, ErrorCategory.COMPATIBILITY, {
      suggestions,
      recoverable: false,
    });
  }

  /**
   * Create a hardware acceleration error
   */
  static hardwareAcceleration(message: string, failureReasons: string[] = []): CloakscreenError {
    return new CloakscreenError(
      message,
      ErrorCode.HARDWARE_ACCELERATION_REQUIRED,
      ErrorCategory.DRM,
      {
        component: 'HardwareAcceleration',
        details: { failureReasons },
        suggestions: [
          'Enable hardware acceleration in your browser settings',
          'Update your graphics drivers',
          'Ensure your system supports hardware-backed DRM',
          'Try using Chrome or Edge for better DRM support',
          ...failureReasons.map(reason => `Issue: ${reason}`),
        ],
        recoverable: false,
      }
    );
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handle and standardize any error
   */
  static handle(error: unknown, component: string, method?: string): CloakscreenError {
    // If it's already a CloakscreenError, return as-is
    if (error instanceof CloakscreenError) {
      return error;
    }

    // If it's a standard Error, wrap it
    if (error instanceof Error) {
      return new CloakscreenError(error.message, ErrorCode.INTERNAL_ERROR, ErrorCategory.INTERNAL, {
        component,
        method,
        details: { originalError: error.name },
        recoverable: false,
      });
    }

    // Handle unknown error types
    const message = typeof error === 'string' ? error : 'Unknown error occurred';
    return new CloakscreenError(message, ErrorCode.UNKNOWN_ERROR, ErrorCategory.INTERNAL, {
      component,
      method,
      recoverable: false,
    });
  }

  /**
   * Log error with appropriate level
   */
  static log(error: CloakscreenError, logger: any): void {
    const details = error.getDetails();

    if (error.category === ErrorCategory.INTERNAL) {
      logger.error('Internal error:', details);
    } else if (error.isRecoverable()) {
      logger.warn('Recoverable error:', details);
    } else {
      logger.error('Critical error:', details);
    }
  }
}
