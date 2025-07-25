/**
 * PallyCon DRM Encryption Implementation
 *
 * Handles video encryption using PallyCon/DoveRunner CLI tools
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { DRMEncryption } from '../base/DRMEncryption';
import {
  EncryptionResult,
  EncryptedContent,
  ValidationResult,
  EncryptionCapabilities,
  EncryptedSegment,
} from '../types';
import { drmLogger } from '../../utils/logger';

export class PallyConEncryption extends DRMEncryption {
  constructor(config: any) {
    super('pallycon', config);
  }

  /**
   * Get PallyCon encryption capabilities
   */
  getCapabilities(): EncryptionCapabilities {
    return {
      videoFormats: ['mp4'],
      manifestTypes: ['dash'],
      encryptionTool: 'cli',
      requiresLocalTool: true,
      keySystems: ['com.widevine.alpha', 'com.microsoft.playready', 'com.apple.fps'],
      supportedCodecs: ['h264', 'h265'],
      maxDimensions: {
        width: 4096,
        height: 4096,
      },
    };
  }

  /**
   * Encrypt video using DoveRunner CLI
   */
  async encryptVideo(
    inputPath: string,
    outputDir: string,
    contentId: string
  ): Promise<EncryptionResult> {
    try {
      // Check dependencies first
      if (!(await this.checkDependencies())) {
        throw new Error('DoveRunner CLI not found. Please install DoveRunner CLI tools.');
      }

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Generate encryption key and key ID
      const keyId = this.generateKeyId();
      const contentKey = this.generateContentKey();

      // Create DoveRunner configuration
      const configPath = await this.createDoveRunnerConfig(
        inputPath,
        outputDir,
        contentId,
        keyId,
        contentKey
      );

      // Run DoveRunner CLI
      const encryptionResult = await this.runDoveRunnerCLI(configPath, outputDir);

      // Generate DASH manifest
      const manifestPath = await this.generateDashManifest(
        outputDir,
        contentId,
        keyId,
        encryptionResult.segments
      );

      return {
        success: true,
        outputPath: outputDir,
        manifestPath,
        metadata: {
          provider: 'pallycon',
          keyId,
          contentId,
          encryptionTime: new Date(),
          manifestType: 'dash',
        },
      };
    } catch (error) {
      drmLogger.error('Encryption failed:', error);
      return {
        success: false,
        outputPath: outputDir,
        manifestPath: '',
        metadata: {
          provider: 'pallycon',
          keyId: '',
          contentId,
          encryptionTime: new Date(),
          manifestType: 'dash',
        },
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Generate DASH manifest for encrypted content
   */
  async generateManifest(encryptedContent: EncryptedContent, outputPath: string): Promise<string> {
    const manifestPath = path.join(outputPath, 'stream.mpd');

    const manifest = this.createDashManifest(encryptedContent);
    await fs.writeFile(manifestPath, manifest, 'utf8');

    return manifestPath;
  }

  /**
   * Validate encrypted content can be played
   */
  async validateEncryption(manifestPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check if manifest file exists
      await fs.access(manifestPath);

      // Parse and validate manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf8');

      // Basic validation - check for required DASH elements
      if (!manifestContent.includes('<MPD')) {
        result.valid = false;
        result.errors.push('Invalid DASH manifest: Missing MPD element');
      }

      if (!manifestContent.includes('ContentProtection')) {
        result.valid = false;
        result.errors.push('Invalid DASH manifest: Missing ContentProtection');
      }

      // Check for PallyCon-specific elements
      if (!manifestContent.includes('com.widevine.alpha')) {
        result.warnings.push('Widevine protection not found in manifest');
      }

      // TODO: Add actual playback test with Shaka Player
      result.playbackTest = {
        canLoad: true,
        canPlay: false, // Would need actual DRM testing
        drmActive: manifestContent.includes('ContentProtection'),
        errorMessage: 'Playback testing not implemented yet',
      };
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation failed: ${error}`);
    }

    return result;
  }

  /**
   * Check if DoveRunner CLI is available
   */
  async checkDependencies(): Promise<boolean> {
    return new Promise(resolve => {
      // Try to run DoveRunner CLI version command
      const doverunner = spawn('doverunner', ['--version']);

      doverunner.on('close', code => {
        resolve(code === 0);
      });

      doverunner.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Get setup instructions for DoveRunner CLI
   */
  getSetupInstructions(): string[] {
    return [
      'DoveRunner CLI is required for PallyCon encryption. Set it up:',
      '',
      '1. Sign up for PallyCon/DoveRunner trial: https://console.pallycon.com',
      '2. Download DoveRunner CLI from the console',
      '3. Install and configure with your credentials',
      '4. Ensure "doverunner" command is in your PATH',
      '',
      'For detailed setup instructions, see: docs/doverunner-setup.md',
    ];
  }

  /**
   * Generate a random key ID
   */
  private generateKeyId(): string {
    // Generate a UUID-like key ID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate a random content key
   */
  private generateContentKey(): string {
    // Generate a 32-character hex key
    const chars = '0123456789abcdef';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  }

  /**
   * Create DoveRunner configuration file
   */
  private async createDoveRunnerConfig(
    inputPath: string,
    outputDir: string,
    contentId: string,
    keyId: string,
    contentKey: string
  ): Promise<string> {
    const config = {
      input: inputPath,
      output: outputDir,
      content_id: contentId,
      key_id: keyId,
      content_key: contentKey,
      drm_systems: ['widevine', 'playready'],
      packaging_format: 'dash',
      segment_duration: 2,
    };

    const configPath = path.join(outputDir, 'doverunner-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return configPath;
  }

  /**
   * Run DoveRunner CLI with configuration
   */
  private async runDoveRunnerCLI(
    configPath: string,
    outputDir: string
  ): Promise<{ segments: EncryptedSegment[] }> {
    return new Promise((resolve, reject) => {
      drmLogger.info('Running DoveRunner CLI...');

      const doverunner = spawn('doverunner', ['--config', configPath]);

      let stdout = '';
      let stderr = '';

      doverunner.stdout.on('data', data => {
        stdout += data.toString();
        drmLogger.debug(`DoveRunner: ${data}`);
      });

      doverunner.stderr.on('data', data => {
        stderr += data.toString();
        drmLogger.error(`DoveRunner: ${data}`);
      });

      doverunner.on('close', code => {
        if (code === 0) {
          drmLogger.info('✅ DoveRunner encryption completed');

          // Parse output to find encrypted segments
          // This is a simplified implementation - real DoveRunner would provide this info
          const segments: EncryptedSegment[] = [
            {
              path: path.join(outputDir, 'segment_0.m4s'),
              duration: 2.0,
              index: 0,
              keyId: 'default-key-id',
            },
          ];

          resolve({ segments });
        } else {
          reject(new Error(`DoveRunner CLI failed with code ${code}: ${stderr}`));
        }
      });

      doverunner.on('error', error => {
        reject(new Error(`Failed to start DoveRunner CLI: ${error.message}`));
      });
    });
  }

  /**
   * Generate DASH manifest for encrypted segments
   */
  private async generateDashManifest(
    outputDir: string,
    contentId: string,
    keyId: string,
    segments: EncryptedSegment[]
  ): Promise<string> {
    const manifestPath = path.join(outputDir, 'stream.mpd');
    const manifest = this.createDashManifest({
      contentId,
      keyId,
      segments,
      initData: new Uint8Array(),
      drmSystemData: {
        widevine: {
          licenseUrl:
            this.config.licenseServer || 'https://license-global.pallycon.com/ri/licenseManager.do',
        },
      },
    });

    await fs.writeFile(manifestPath, manifest);
    return manifestPath;
  }

  /**
   * Create DASH manifest XML content
   */
  private createDashManifest(encryptedContent: EncryptedContent): string {
    const totalDuration = encryptedContent.segments.reduce((sum, seg) => sum + seg.duration, 0);

    return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     xmlns:cenc="urn:mpeg:cenc:2013"
     type="static" 
     mediaPresentationDuration="PT${totalDuration}S"
     profiles="urn:mpeg:dash:profile:isoff-main:2011">
  
  <Period>
    <AdaptationSet mimeType="video/mp4" codecs="avc1.42E01E">
      
      <!-- Widevine Content Protection -->
      <ContentProtection schemeIdUri="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed">
        <cenc:default_KID>${encryptedContent.keyId}</cenc:default_KID>
      </ContentProtection>
      
      <!-- PlayReady Content Protection -->
      <ContentProtection schemeIdUri="urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95">
        <cenc:default_KID>${encryptedContent.keyId}</cenc:default_KID>
      </ContentProtection>
      
      <Representation bandwidth="100000" width="100" height="100">
        <SegmentList>
          <Initialization sourceURL="init.mp4"/>
          ${encryptedContent.segments
            .map((_, index) => `<SegmentURL media="segment_${index}.m4s"/>`)
            .join('\n          ')}
        </SegmentList>
      </Representation>
      
    </AdaptationSet>
  </Period>
</MPD>`;
  }
}
