/**
 * DRMProvider - Base class for DRM providers
 *
 * Defines the interface that all DRM providers must implement
 * for license management and content protection.
 */

import EventEmitter from '../../utils/EventEmitter';
import { DRMImplementation } from '../../types';
import {
  DRMCapabilities,
  ProviderMetadata,
  ProviderHealth,
  LicenseRequest,
  LicenseResponse,
} from './types';
import { MediaPlayer } from '../../types/player';
import { DRMProviderConfig } from '../../types/config';

export abstract class DRMProvider extends EventEmitter implements DRMImplementation {
  protected config: DRMProviderConfig;
  protected initialized: boolean = false;

  constructor(config: DRMProviderConfig) {
    super();
    this.config = config;
  }

  // ===== Core DRM Methods (Required) =====

  /**
   * Initialize the DRM provider
   */
  abstract initialize(): Promise<void>;

  /**
   * Get license token for content
   */
  abstract getLicenseToken(contentId: string): Promise<string>;

  /**
   * Get license server URL
   */
  abstract getLicenseServerUrl(): string;

  /**
   * Get content URL for protected content
   */
  abstract getContentUrl(): Promise<string>;

  /**
   * Configure player with DRM settings
   */
  abstract configurePlayer(player: MediaPlayer): void;

  /**
   * Cleanup and destroy provider
   */
  abstract destroy(): void;

  // ===== New Standardized Methods (Required) =====

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): DRMCapabilities;

  /**
   * Validate provider configuration
   */
  abstract validateConfig(): void;

  /**
   * Get provider health status
   */
  abstract getHealthStatus(): Promise<ProviderHealth>;

  /**
   * Get provider metadata (static method)
   */
  static getMetadata(): ProviderMetadata {
    throw new Error('getMetadata() must be implemented by provider subclass');
  }

  // ===== Optional Lifecycle Hooks =====

  /**
   * Hook called before license request is sent
   */
  onLicenseRequest?(request: LicenseRequest): Promise<LicenseRequest>;

  /**
   * Hook called after license response is received
   */
  onLicenseResponse?(response: LicenseResponse): Promise<LicenseResponse>;

  /**
   * Hook called when an error occurs
   */
  onError?(error: Error): Promise<void>;

  // ===== Utility Methods =====

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get provider name from metadata
   */
  getName(): string {
    return (this.constructor as typeof DRMProvider).getMetadata().name;
  }

  /**
   * Get provider display name from metadata
   */
  getDisplayName(): string {
    return (this.constructor as typeof DRMProvider).getMetadata().displayName;
  }

  /**
   * Basic configuration validation (can be overridden)
   */
  protected validateBasicConfig(): void {
    if (!this.config) {
      throw new Error('DRM provider configuration is required');
    }
  }
}
