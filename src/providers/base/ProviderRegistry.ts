/**
 * ProviderRegistry - Central registry for DRM providers
 *
 * Manages registration, discovery, and instantiation of DRM providers
 */

import { DRMProvider } from './DRMProvider';
import { ProviderMetadata } from './types';
import { providerLogger } from '../../utils/logger';
import { getEMESupport } from '../../utils/eme';
import { DRMProviderConfig } from '../../types/config';

// Type for concrete DRM provider constructors
type DRMProviderConstructor = new (config: any) => DRMProvider;

export class ProviderRegistry {
  private providers = new Map<string, DRMProviderConstructor>();
  private static instance: ProviderRegistry;

  /**
   * Get singleton instance
   */
  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register a DRM provider
   */
  register(name: string, providerClass: DRMProviderConstructor): void {
    if (this.providers.has(name)) {
      providerLogger.warn(`Provider '${name}' is already registered. Overwriting.`);
    }

    this.providers.set(name, providerClass);
    providerLogger.debug(`Registered provider: ${name}`);
  }

  /**
   * Create a provider instance
   */
  create(name: string, config: DRMProviderConfig): DRMProvider {
    const ProviderClass = this.providers.get(name);

    if (!ProviderClass) {
      throw new Error(
        `Provider '${name}' is not registered. Available providers: ${this.getAvailable().join(', ')}`
      );
    }

    // Pass the full config to the provider constructor
    return new ProviderClass(config);
  }

  /**
   * Get all available provider names
   */
  getAvailable(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   */
  isRegistered(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Check if a provider is supported in the current environment
   */
  async isSupported(name: string): Promise<boolean> {
    const ProviderClass = this.providers.get(name);

    if (!ProviderClass) {
      return false;
    }

    try {
      // Get provider metadata using type assertion
      const metadata = (ProviderClass as any).getMetadata();

      // Check if any of the provider's key systems are supported
      const emeSupport = await getEMESupport();

      return metadata.supportedKeySystems.some(
        (keySystem: any) => emeSupport.keySystems[keySystem as keyof typeof emeSupport.keySystems]
      );
    } catch (error) {
      providerLogger.warn(`Error checking support for provider '${name}':`, error);
      return false;
    }
  }

  /**
   * Get provider metadata
   */
  getMetadata(name: string): ProviderMetadata | null {
    const ProviderClass = this.providers.get(name);

    if (!ProviderClass) {
      return null;
    }

    try {
      // Use type assertion to access static method
      return (ProviderClass as any).getMetadata();
    } catch (error) {
      providerLogger.warn(`Error getting metadata for provider '${name}':`, error);
      return null;
    }
  }

  /**
   * Get all provider metadata
   */
  getAllMetadata(): Record<string, ProviderMetadata> {
    const metadata: Record<string, ProviderMetadata> = {};

    for (const name of this.getAvailable()) {
      const providerMetadata = this.getMetadata(name);
      if (providerMetadata) {
        metadata[name] = providerMetadata;
      }
    }

    return metadata;
  }

  /**
   * Unregister a provider
   */
  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
  }
}

// Export singleton instance
export const providerRegistry = ProviderRegistry.getInstance();
export default providerRegistry;
