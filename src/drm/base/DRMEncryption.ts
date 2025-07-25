/**
 * Abstract DRM Encryption Interface
 *
 * Defines the contract that all DRM provider encryption implementations must follow
 */

import {
  EncryptionResult,
  EncryptedContent,
  ValidationResult,
  EncryptionCapabilities,
} from '../types';
import { drmLogger } from '../../utils/logger';

export abstract class DRMEncryption {
  protected provider: string;
  protected config: any;

  constructor(provider: string, config: any) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Get encryption capabilities for this provider
   */
  abstract getCapabilities(): EncryptionCapabilities;

  /**
   * Encrypt a video file with DRM protection
   * @param inputPath Path to the input video file
   * @param outputDir Directory to store encrypted content
   * @param contentId Unique content identifier
   * @returns Encryption result with manifest path and metadata
   */
  abstract encryptVideo(
    inputPath: string,
    outputDir: string,
    contentId: string
  ): Promise<EncryptionResult>;

  /**
   * Generate manifest file for encrypted content
   * @param encryptedContent Encrypted content information
   * @param outputPath Path where manifest should be saved
   * @returns Path to generated manifest file
   */
  abstract generateManifest(
    encryptedContent: EncryptedContent,
    outputPath: string
  ): Promise<string>;

  /**
   * Validate that encrypted content can be played back
   * @param manifestPath Path to the manifest file
   * @returns Validation result
   */
  abstract validateEncryption(manifestPath: string): Promise<ValidationResult>;

  /**
   * Check if required tools/dependencies are available
   * @returns True if all dependencies are available
   */
  abstract checkDependencies(): Promise<boolean>;

  /**
   * Get setup instructions for missing dependencies
   * @returns Array of setup instruction strings
   */
  abstract getSetupInstructions(): string[];

  /**
   * Clean up temporary files created during encryption
   * @param outputDir Directory to clean up
   */
  async cleanup(outputDir: string): Promise<void> {
    // Default implementation - can be overridden
    drmLogger.info(`Cleanup completed for ${outputDir}`);
  }

  /**
   * Get provider name
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Get provider configuration
   */
  getConfig(): any {
    return this.config;
  }
}
