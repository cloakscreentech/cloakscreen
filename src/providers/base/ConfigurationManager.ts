/**
 * ConfigurationManager - Flexible configuration system for DRM providers
 *
 * Handles provider-agnostic configuration validation, transformation, and management
 */

import * as v from 'valibot';
import { ProviderMetadata } from './types';
import { providerRegistry } from './ProviderRegistry';

/**
 * Base configuration schema that all providers must support
 */
export const StandardConfigSchema = v.object({
  licenseServer: v.pipe(v.string(), v.url('License server must be a valid URL')),
  certificateUrl: v.optional(v.pipe(v.string(), v.url('Certificate URL must be a valid URL'))),
  headers: v.optional(v.record(v.string(), v.string())),
});

/**
 * Provider configuration with validation
 */
export interface ValidatedProviderConfig<T = any> {
  /** Provider name */
  name: string;

  /** Validated configuration */
  config: T;

  /** Provider metadata */
  metadata: ProviderMetadata;

  /** Validation warnings (non-blocking) */
  warnings: string[];
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  valid: boolean;

  /** Validation errors (blocking) */
  errors: string[];

  /** Validation warnings (non-blocking) */
  warnings: string[];

  /** Suggested fixes */
  suggestions: string[];
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private configSchemas = new Map<string, v.BaseSchema<any, any, any>>();

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Register a configuration schema for a provider
   */
  registerSchema(providerName: string, schema: v.BaseSchema<any, any, any>): void {
    this.configSchemas.set(providerName, schema);
  }

  /**
   * Validate provider configuration
   */
  validateConfig(providerName: string, config: any): ConfigValidationResult {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    try {
      // Check if provider is registered
      if (!providerRegistry.isRegistered(providerName)) {
        result.valid = false;
        result.errors.push(`Provider '${providerName}' is not registered`);
        result.suggestions.push(
          `Available providers: ${providerRegistry.getAvailable().join(', ')}`
        );
        return result;
      }

      // Get provider metadata for validation context
      const metadata = providerRegistry.getMetadata(providerName);
      if (!metadata) {
        result.valid = false;
        result.errors.push(`Unable to get metadata for provider '${providerName}'`);
        return result;
      }

      // Validate required fields
      for (const requiredField of metadata.requiredConfig) {
        if (!config || config[requiredField] === undefined || config[requiredField] === null) {
          result.valid = false;
          result.errors.push(`Required field '${requiredField}' is missing`);
          result.suggestions.push(`Add '${requiredField}' to your provider configuration`);
        }
      }

      // Check for unknown fields (warnings only)
      if (config && typeof config === 'object') {
        const knownFields = [...metadata.requiredConfig];
        const providedFields = Object.keys(config);

        for (const field of providedFields) {
          if (!knownFields.includes(field)) {
            result.warnings.push(
              `Unknown configuration field '${field}' for provider '${providerName}'`
            );
            result.suggestions.push(`Known fields: ${knownFields.join(', ')}`);
          }
        }
      }

      // Use provider-specific schema if available
      const schema = this.configSchemas.get(providerName);
      if (schema) {
        try {
          v.parse(schema, config);
        } catch (error) {
          if (v.isValiError(error)) {
            result.valid = false;
            const flattened = v.flatten(error.issues);
            if (flattened.nested) {
              Object.entries(flattened.nested).forEach(([path, issues]) => {
                if (issues && issues.length > 0) {
                  result.errors.push(`${path}: ${(issues[0] as any).message || 'Invalid value'}`);
                }
              });
            }
          }
        }
      } else {
        // Fall back to standard schema validation
        try {
          v.parse(StandardConfigSchema, config);
        } catch (error) {
          if (v.isValiError(error)) {
            // Only add errors for standard fields, warnings for others
            const flattened = v.flatten(error.issues);
            if (flattened.nested) {
              Object.entries(flattened.nested).forEach(([path, issues]) => {
                if (issues && issues.length > 0) {
                  if (['licenseServer', 'certificateUrl', 'headers'].includes(path)) {
                    result.valid = false;
                    result.errors.push(`${path}: ${(issues[0] as any).message || 'Invalid value'}`);
                  } else {
                    result.warnings.push(
                      `${path}: ${(issues[0] as any).message || 'Invalid value'}`
                    );
                  }
                }
              });
            }
          }
        }
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Configuration validation failed: ${error}`);
    }

    return result;
  }

  /**
   * Validate and transform provider configuration
   */
  validateAndTransform<T = any>(providerName: string, config: any): ValidatedProviderConfig<T> {
    const validation = this.validateConfig(providerName, config);
    const metadata = providerRegistry.getMetadata(providerName);

    if (!validation.valid) {
      throw new Error(
        `Configuration validation failed for provider '${providerName}':\n${validation.errors.join('\n')}`
      );
    }

    if (!metadata) {
      throw new Error(`Unable to get metadata for provider '${providerName}'`);
    }

    return {
      name: providerName,
      config: config as T,
      metadata,
      warnings: validation.warnings,
    };
  }

  /**
   * Get configuration template for a provider
   */
  getConfigTemplate(providerName: string): Record<string, any> | null {
    const metadata = providerRegistry.getMetadata(providerName);
    if (!metadata) {
      return null;
    }

    const template: Record<string, any> = {};

    // Add required fields with placeholder values
    for (const field of metadata.requiredConfig) {
      template[field] = `<${field}>`;
    }

    // No optional fields in simplified metadata
    const optionalFields: Record<string, any> = {};

    return {
      ...template,
      ...optionalFields,
    };
  }

  /**
   * Auto-detect configuration from environment variables
   */
  autoDetectConfig(providerName: string): Record<string, any> | null {
    const metadata = providerRegistry.getMetadata(providerName);
    if (!metadata) {
      return null;
    }

    const config: Record<string, any> = {};
    const envPrefix = `CLOAKSCREEN_${providerName.toUpperCase()}_`;

    // Try to detect required fields from environment
    for (const field of metadata.requiredConfig) {
      const envKey = `${envPrefix}${field.toUpperCase()}`;
      const envValue = this.getEnvVar(envKey);
      if (envValue) {
        config[field] = envValue;
      }
    }

    // No optional fields in simplified metadata

    return Object.keys(config).length > 0 ? config : null;
  }

  /**
   * Get environment variable (works in Node.js and browser)
   */
  private getEnvVar(key: string): string | undefined {
    // Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }

    // Browser environment (Vite, Webpack, etc.)
    try {
      // Use dynamic import to avoid Jest syntax errors
      const importMeta =
        (globalThis as any).importMeta ||
        (typeof window !== 'undefined' && (window as any).importMeta);
      if (importMeta?.env) {
        return importMeta.env[key];
      }
    } catch {
      // Ignore if import.meta is not available
    }

    // Legacy browser environment
    if (typeof window !== 'undefined' && (window as any).env) {
      return (window as any).env[key];
    }

    return undefined;
  }
}

// Export singleton instance
export const configurationManager = ConfigurationManager.getInstance();
export default configurationManager;
