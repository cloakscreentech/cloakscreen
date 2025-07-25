/**
 * Configuration validation utilities using Valibot
 *
 * Validates and normalizes configuration objects with runtime type safety
 */

import * as v from 'valibot';
import { CloakscreenConfig, DRMProviderConfig } from '../types';
import { ErrorFactory, ErrorCode } from '../errors';
import { getDRMCredentials } from './env';

// Valibot schemas for validation

const DRMProviderConfigSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Provider name is required')),
  siteId: v.optional(v.pipe(v.string(), v.minLength(1, 'Site ID is required'))),
  tokenEndpoint: v.optional(v.pipe(v.string(), v.minLength(1, 'Token endpoint is required'))),
  licenseServer: v.optional(v.string()),
  certificateUri: v.optional(v.string()),
});

const ElementSchema = v.union([
  v.pipe(v.string(), v.minLength(1, 'Element selector cannot be empty')),
  v.instance(HTMLElement, 'Element must be a valid HTMLElement'),
]);

const CloakscreenConfigSchema = v.object({
  element: ElementSchema,
  provider: v.union([
    v.pipe(v.string(), v.minLength(1, 'Provider name cannot be empty')),
    DRMProviderConfigSchema,
  ]),
  options: v.optional(
    v.object({
      content: v.optional(v.string()),
      readOnly: v.optional(v.boolean()),
      fallbackMode: v.optional(v.picklist(['blur', 'hide', 'placeholder', 'none'])),
      debug: v.optional(v.boolean()),
    })
  ),
});

/**
 * Validate and normalize Cloakscreen configuration using Valibot
 */
export function validateConfig(config: unknown): CloakscreenConfig {
  try {
    // Parse and validate with Valibot
    const parsed = v.parse(CloakscreenConfigSchema, config);

    // Normalize provider config
    const normalizedProvider = normalizeProviderConfig(
      parsed.provider as DRMProviderConfig | string
    );

    // Apply defaults manually for better control
    const normalizedConfig: CloakscreenConfig = {
      element: parsed.element,
      provider: normalizedProvider,
      options: {
        fallbackMode: 'blur',
        debug: false,
        ...parsed.options,
      },
    };

    return normalizedConfig;
  } catch (error) {
    if (v.isValiError(error)) {
      // Convert Valibot errors to ConfigurationError with helpful suggestions
      const flattened = v.flatten(error.issues);
      const issues: string[] = [];

      // Handle nested errors
      if (flattened.nested) {
        Object.entries(flattened.nested).forEach(([path, pathIssues]) => {
          if (pathIssues && pathIssues.length > 0) {
            issues.push(`${path}: ${(pathIssues[0] as any).message || 'Invalid value'}`);
          }
        });
      }

      // Handle root errors
      if (flattened.root && flattened.root.length > 0) {
        issues.push(`root: ${(flattened.root[0] as any).message || 'Invalid value'}`);
      }

      throw ErrorFactory.configuration(
        ErrorCode.INVALID_CONFIG,
        'validateConfig',
        `Configuration validation failed: ${issues.join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Normalize provider configuration
 */
function normalizeProviderConfig(provider: DRMProviderConfig | string): DRMProviderConfig {
  if (typeof provider === 'string') {
    // Simple provider name - validate and create default config
    const validProviders = ['pallycon'];

    if (!validProviders.includes(provider)) {
      throw ErrorFactory.configuration(
        ErrorCode.INVALID_PROVIDER,
        'normalizeProviderConfig',
        `Invalid DRM provider: ${provider}`,
        {
          suggestions: [
            'Use a supported provider (pallycon)',
            'Check provider name spelling',
            'Ensure provider is properly configured',
          ],
        }
      );
    }

    switch (provider) {
      case 'pallycon':
        // Try to get credentials from environment variables
        try {
          const { siteId, tokenEndpoint } = getDRMCredentials();

          return {
            name: 'pallycon',
            config: {
              siteId,
              tokenEndpoint,
            },
          };
        } catch {
          // No fallback - require explicit configuration
          throw new Error(
            'DRM provider requires siteId to be configured via environment variables or explicit configuration'
          );
        }
      default:
        throw ErrorFactory.configuration(
          ErrorCode.INVALID_PROVIDER,
          'normalizeProviderConfig',
          `Unsupported provider: ${provider}`
        );
    }
  }

  // Full provider configuration - already validated by main schema
  return provider;
}

/**
 * Validate a DRM provider configuration object
 */
export function validateProviderConfig(config: unknown): DRMProviderConfig {
  try {
    return v.parse(DRMProviderConfigSchema, config);
  } catch (error) {
    if (v.isValiError(error)) {
      const flattened = v.flatten(error.issues);
      const issues: string[] = [];

      if (flattened.nested) {
        Object.entries(flattened.nested).forEach(([path, pathIssues]) => {
          if (pathIssues && pathIssues.length > 0) {
            issues.push(`${path}: ${(pathIssues[0] as any).message || 'Invalid value'}`);
          }
        });
      }

      if (flattened.root && flattened.root.length > 0) {
        issues.push(`root: ${(flattened.root[0] as any).message || 'Invalid value'}`);
      }

      throw ErrorFactory.configuration(
        ErrorCode.INVALID_PROVIDER,
        'validateProviderConfig',
        `Provider configuration validation failed: ${issues.join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Check if a value is a valid element selector or HTMLElement
 */
export function isValidElement(element: unknown): element is string | HTMLElement {
  try {
    v.parse(ElementSchema, element);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize configuration for logging (remove sensitive data)
 */
export function sanitizeConfigForLogging(config: CloakscreenConfig): Partial<CloakscreenConfig> {
  const sanitized = { ...config };

  if (typeof sanitized.provider === 'object' && sanitized.provider.config) {
    sanitized.provider = {
      ...sanitized.provider,
      config: {
        ...sanitized.provider.config,
        // Mask sensitive fields
        siteId: sanitized.provider.config.siteId ? '***' : undefined,
        tokenEndpoint: sanitized.provider.config.tokenEndpoint ? '[REDACTED]' : undefined,
      },
    };
  }

  return sanitized;
}
