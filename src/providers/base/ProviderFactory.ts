/**
 * ProviderFactory - Intelligent provider creation and selection
 *
 * Handles provider instantiation with auto-detection and fallback capabilities
 */

import { DRMProvider } from './DRMProvider';
import { providerRegistry } from './ProviderRegistry';
import { getEMESupport } from '../../utils/eme';
import { DRMProviderConfig } from '../../types/config';
import { KeySystem } from '../../utils/eme';

export class ProviderFactory {
  /**
   * Create a provider by name
   */
  static create(name: string, config: DRMProviderConfig): DRMProvider {
    return providerRegistry.create(name, config);
  }

  /**
   * Create the best available provider based on preferences and environment
   */
  static async createBestProvider(
    preferences: string[] = [],
    config: Record<string, DRMProviderConfig> = {}
  ): Promise<DRMProvider> {
    // Try preferred providers first
    for (const name of preferences) {
      if (await this.isProviderSupported(name)) {
        const providerConfig = config[name] || {};
        return this.create(name, providerConfig);
      }
    }

    // Fall back to any supported provider
    const available = await this.getAvailableProviders();
    if (available.length > 0) {
      const fallbackName = available[0];
      const providerConfig = config[fallbackName] || {};
      return this.create(fallbackName, providerConfig);
    }

    throw new Error('No supported DRM providers available in this environment');
  }

  /**
   * Check if a provider is supported in the current environment
   */
  static async isProviderSupported(name: string): Promise<boolean> {
    return await providerRegistry.isSupported(name);
  }

  /**
   * Get all available provider names
   */
  static getAvailableProviders(): Promise<string[]> {
    return this.filterSupportedProviders(providerRegistry.getAvailable());
  }

  /**
   * Get all registered provider names (regardless of support)
   */
  static getRegisteredProviders(): string[] {
    return providerRegistry.getAvailable();
  }

  /**
   * Filter providers by support in current environment
   */
  static async filterSupportedProviders(providers: string[]): Promise<string[]> {
    const supported: string[] = [];

    for (const provider of providers) {
      if (await this.isProviderSupported(provider)) {
        supported.push(provider);
      }
    }

    return supported;
  }

  /**
   * Get provider capabilities by name
   */
  static getProviderCapabilities(name: string): KeySystem[] | null {
    const metadata = providerRegistry.getMetadata(name);
    return metadata ? metadata.supportedKeySystems : null;
  }

  /**
   * Find providers that support specific key systems
   */
  static async findProvidersByKeySystem(keySystems: string[]): Promise<string[]> {
    const allProviders = providerRegistry.getAvailable();
    const matching: string[] = [];

    for (const providerName of allProviders) {
      const metadata = providerRegistry.getMetadata(providerName);
      if (metadata) {
        const hasMatchingKeySystem = keySystems.some(ks =>
          metadata.supportedKeySystems.includes(ks as KeySystem)
        );

        if (hasMatchingKeySystem && (await this.isProviderSupported(providerName))) {
          matching.push(providerName);
        }
      }
    }

    return matching;
  }

  /**
   * Get detailed environment support information
   */
  static async getEnvironmentSupport(): Promise<{
    emeSupported: boolean;
    supportedProviders: string[];
    unsupportedProviders: string[];
    recommendations: string[];
  }> {
    const emeSupport = await getEMESupport();
    const allProviders = providerRegistry.getAvailable();
    const supportedProviders: string[] = [];
    const unsupportedProviders: string[] = [];

    for (const provider of allProviders) {
      if (await this.isProviderSupported(provider)) {
        supportedProviders.push(provider);
      } else {
        unsupportedProviders.push(provider);
      }
    }

    // Generate recommendations based on environment
    const recommendations: string[] = [];
    if (emeSupport.keySystems['com.widevine.alpha']) {
      recommendations.push('Use Widevine-compatible providers for best compatibility');
    }
    if (emeSupport.hardwareSecuritySupported) {
      recommendations.push('Hardware security is available - consider L1 security level');
    }
    if (supportedProviders.length === 0) {
      recommendations.push('No DRM providers supported - check browser compatibility');
    }

    return {
      emeSupported: emeSupport.supported,
      supportedProviders,
      unsupportedProviders,
      recommendations,
    };
  }
}

export default ProviderFactory;
