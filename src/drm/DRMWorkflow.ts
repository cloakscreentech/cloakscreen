/**
 * DRM Workflow Orchestrator
 *
 * Coordinates the complete video generation → encryption → manifest → validation pipeline
 */

import path from 'path';
import fs from 'fs/promises';
import { VideoGenerator } from './VideoGenerator';
import { DRMEncryption } from './base/DRMEncryption';
import { PallyConEncryption } from './providers/PallyConEncryption';
import {
  DRMWorkflowOptions,
  VideoGenerationOptions,
  EncryptionResult,
  ValidationResult,
} from './types';
import { drmLogger } from '../utils/logger';

export class DRMWorkflow {
  private provider: string;
  private videoGenerator: VideoGenerator;
  private drmEncryption: DRMEncryption;

  constructor(provider: string, config: any = {}) {
    this.provider = provider;
    this.videoGenerator = VideoGenerator.getInstance();
    this.drmEncryption = this.createEncryptionProvider(provider, config);
  }

  /**
   * Execute complete DRM workflow
   */
  async execute(options: DRMWorkflowOptions): Promise<EncryptionResult> {
    drmLogger.info(`Starting ${this.provider} workflow...`);

    try {
      // Step 1: Generate video
      drmLogger.info('Step 1: Generating video...');
      const videoPath = await this.generateVideo(options);

      // Step 2: Encrypt video
      drmLogger.info('Step 2: Encrypting video...');
      const encryptionResult = await this.encryptVideo(videoPath, options);

      // Step 3: Validate encryption (if requested)
      if (options.validate !== false) {
        drmLogger.info('Step 3: Validating encryption...');
        const validationResult = await this.validateEncryption(encryptionResult.manifestPath);

        if (!validationResult.valid) {
          encryptionResult.warnings = encryptionResult.warnings || [];
          encryptionResult.warnings.push(...validationResult.errors);
        }
      }

      // Step 4: Cleanup (if requested)
      if (options.cleanup !== false) {
        drmLogger.info('Step 4: Cleaning up temporary files...');
        await this.cleanup(videoPath, options);
      }

      drmLogger.info('✅ Workflow completed successfully');
      return encryptionResult;
    } catch (error) {
      drmLogger.error('❌ Workflow failed:', error);
      throw error;
    }
  }

  /**
   * Generate video only
   */
  async generateVideo(options: DRMWorkflowOptions): Promise<string> {
    const tempVideoPath = path.join(options.outputDir, 'temp_video.mp4');

    // Apply provider-specific optimizations
    const optimizedOptions = await this.applyProviderOptimizations(options.videoOptions);

    return await this.videoGenerator.generateForProvider(
      this.provider,
      optimizedOptions,
      tempVideoPath
    );
  }

  /**
   * Encrypt video only
   */
  async encryptVideo(videoPath: string, options: DRMWorkflowOptions): Promise<EncryptionResult> {
    const contentId = options.contentId || this.generateContentId();

    return await this.drmEncryption.encryptVideo(videoPath, options.outputDir, contentId);
  }

  /**
   * Validate encryption only
   */
  async validateEncryption(manifestPath: string): Promise<ValidationResult> {
    return await this.drmEncryption.validateEncryption(manifestPath);
  }

  /**
   * Generate responsive video variants
   */
  async generateResponsiveVariants(options: DRMWorkflowOptions): Promise<EncryptionResult[]> {
    const sizes = [
      { width: 100, height: 100, suffix: 'small' },
      { width: 200, height: 200, suffix: 'medium' },
      { width: 400, height: 400, suffix: 'large' },
    ];

    const results: EncryptionResult[] = [];

    for (const size of sizes) {
      const variantOptions = {
        ...options,
        videoOptions: {
          ...options.videoOptions,
          width: size.width,
          height: size.height,
        },
        outputDir: path.join(options.outputDir, size.suffix),
      };

      const result = await this.execute(variantOptions);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if all dependencies are available
   */
  async checkDependencies(): Promise<{ available: boolean; missing: string[] }> {
    const missing: string[] = [];

    // Check video generation dependencies
    if (!(await this.videoGenerator['checkFFmpegAvailable']())) {
      missing.push('FFmpeg');
    }

    // Check DRM encryption dependencies
    if (!(await this.drmEncryption.checkDependencies())) {
      missing.push(`${this.provider} encryption tools`);
    }

    return {
      available: missing.length === 0,
      missing,
    };
  }

  /**
   * Get setup instructions for missing dependencies
   */
  getSetupInstructions(): string[] {
    const instructions: string[] = [];

    // Add video generation instructions
    instructions.push(...VideoGenerator.getFFmpegInstructions());
    instructions.push('');

    // Add DRM-specific instructions
    instructions.push(...this.drmEncryption.getSetupInstructions());

    return instructions;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return this.drmEncryption.getCapabilities();
  }

  /**
   * Create encryption provider instance
   */
  private createEncryptionProvider(provider: string, config: any): DRMEncryption {
    switch (provider) {
      case 'pallycon':
        return new PallyConEncryption(config);

      // Future: Add additional DRM providers as needed
      // case 'axinom':
      //   return new AxinomEncryption(config);
      // case 'ezdrm':
      //   return new EzDrmEncryption(config);

      default:
        throw new Error(`Unsupported DRM provider: ${provider}`);
    }
  }

  /**
   * Apply provider-specific video optimizations
   */
  private async applyProviderOptimizations(
    options: VideoGenerationOptions
  ): Promise<VideoGenerationOptions> {
    const capabilities = this.drmEncryption.getCapabilities();
    const optimized = { ...options };

    // Apply format restrictions
    if (!capabilities.videoFormats.includes(optimized.format)) {
      optimized.format = capabilities.videoFormats[0] as 'mp4' | 'webm';
      drmLogger.info(`Adjusted format to ${optimized.format} for ${this.provider} compatibility`);
    }

    // Apply dimension limits
    if (capabilities.maxDimensions) {
      if (optimized.width > capabilities.maxDimensions.width) {
        optimized.width = capabilities.maxDimensions.width;
        drmLogger.info(`Adjusted width to ${optimized.width} for ${this.provider} limits`);
      }
      if (optimized.height > capabilities.maxDimensions.height) {
        optimized.height = capabilities.maxDimensions.height;
        drmLogger.info(`Adjusted height to ${optimized.height} for ${this.provider} limits`);
      }
    }

    // Apply codec restrictions
    if (optimized.codec && !capabilities.supportedCodecs.includes(optimized.codec)) {
      optimized.codec = capabilities.supportedCodecs[0] as any;
      drmLogger.info(`Adjusted codec to ${optimized.codec} for ${this.provider} compatibility`);
    }

    return optimized;
  }

  /**
   * Generate unique content ID
   */
  private generateContentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `cloakscreen-${this.provider}-${timestamp}-${random}`;
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(videoPath: string, options: DRMWorkflowOptions): Promise<void> {
    try {
      // Remove temporary video file
      await fs.unlink(videoPath);

      // Let the encryption provider handle its cleanup
      await this.drmEncryption.cleanup(options.outputDir);
    } catch (error) {
      drmLogger.warn('Cleanup warning:', error);
    }
  }

  /**
   * Create workflow for specific provider with default options
   */
  static createForProvider(provider: string, config: any = {}): DRMWorkflow {
    return new DRMWorkflow(provider, config);
  }

  /**
   * Quick workflow execution with minimal configuration
   */
  static async quickGenerate(
    provider: string,
    outputDir: string,
    options: Partial<VideoGenerationOptions> = {}
  ): Promise<EncryptionResult> {
    const workflow = new DRMWorkflow(provider);

    const workflowOptions: DRMWorkflowOptions = {
      provider,
      outputDir,
      videoOptions: {
        width: 100,
        height: 100,
        color: 'white',
        duration: 1,
        fps: 1,
        format: 'mp4',
        ...options,
      },
    };

    return await workflow.execute(workflowOptions);
  }
}
