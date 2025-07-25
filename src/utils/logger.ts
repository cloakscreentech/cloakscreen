/**
 * Professional logging system for Cloakscreen
 *
 * Provides structured logging with levels, prefixes, and environment-aware output.
 * Replaces scattered console.* calls throughout the codebase.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableColors?: boolean;
  enableTimestamps?: boolean;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: this.getDefaultLogLevel(),
      prefix: '',
      enableColors: typeof window === 'undefined', // Colors in Node.js only
      enableTimestamps: typeof window === 'undefined', // Timestamps in Node.js only
      ...config,
    };
  }

  /**
   * Debug level logging - for detailed diagnostic information
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, args, '\x1b[36m'); // Cyan
    }
  }

  /**
   * Info level logging - for general information
   */
  info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log('INFO', message, args, '\x1b[32m'); // Green
    }
  }

  /**
   * Warning level logging - for potentially harmful situations
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log('WARN', message, args, '\x1b[33m'); // Yellow
    }
  }

  /**
   * Error level logging - for error events
   */
  error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.log('ERROR', message, args, '\x1b[31m'); // Red
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Internal logging method
   */
  private log(level: string, message: string, args: any[], color: string): void {
    const timestamp = this.config.enableTimestamps ? new Date().toISOString() : '';
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const levelStr = this.config.enableColors ? `${color}${level}\x1b[0m` : level;

    const parts = [timestamp, levelStr, prefix, message].filter(Boolean);

    const formattedMessage = parts.join(' ');

    // Use appropriate console method
    const consoleMethod =
      level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;

    if (args.length > 0) {
      consoleMethod(formattedMessage, ...args);
    } else {
      consoleMethod(formattedMessage);
    }
  }

  /**
   * Get default log level based on environment
   * NPM library convention: Silent by default, debug only when explicitly requested
   */
  private getDefaultLogLevel(): LogLevel {
    // Check for standard debug environment variables
    const logLevel =
      typeof window !== 'undefined'
        ? (window as any).DEBUG || (window as any).CLOAKSCREEN_DEBUG
        : process.env.DEBUG || process.env.CLOAKSCREEN_DEBUG;

    if (logLevel) {
      const level = logLevel.toString().toLowerCase();
      // Support standard DEBUG=cloakscreen* pattern
      if (level.includes('cloakscreen') || level === 'true' || level === '1') {
        return LogLevel.DEBUG;
      }
      // Support explicit levels
      switch (level) {
        case 'debug':
          return LogLevel.DEBUG;
        case 'info':
          return LogLevel.INFO;
        case 'warn':
          return LogLevel.WARN;
        case 'error':
          return LogLevel.ERROR;
        case 'silent':
        case 'false':
        case '0':
          return LogLevel.SILENT;
      }
    }

    // NPM library convention: Silent by default
    // Only show errors unless explicitly debugging
    if (typeof window !== 'undefined') {
      return LogLevel.SILENT; // Browser: completely silent
    }

    // Node.js: Only errors by default
    const nodeEnv = process.env.NODE_ENV;
    switch (nodeEnv) {
      case 'development':
        return LogLevel.ERROR; // Still quiet in dev
      case 'test':
        return LogLevel.SILENT; // Silent in tests
      case 'production':
        return LogLevel.SILENT; // Silent in production
      default:
        return LogLevel.ERROR;
    }
  }
}

// Default logger instance
export const logger = new Logger();

// Debug logging is controlled via environment variables only:
// Node.js: DEBUG=cloakscreen* or CLOAKSCREEN_DEBUG=true
// Browser: Set before loading library via <script>window.DEBUG='cloakscreen*'</script>

// Component-specific loggers
export const createLogger = (component: string): Logger => {
  return logger.child(component);
};

// Convenience exports for common components
export const coreLogger = createLogger('Core');
export const drmLogger = createLogger('DRM');
export const providerLogger = createLogger('Provider');
export const serverLogger = createLogger('Server');
export const utilsLogger = createLogger('Utils');

export default logger;
