/**
 * Enhanced Video Generator
 *
 * Extends the current generate-drm-video.js functionality to support
 * multiple providers and advanced video generation options
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { VideoGenerationOptions } from './types';
import { drmLogger } from '../utils/logger';

export class VideoGenerator {
  private static instance: VideoGenerator;

  /**
   * Get singleton instance
   */
  static getInstance(): VideoGenerator {
    if (!VideoGenerator.instance) {
      VideoGenerator.instance = new VideoGenerator();
    }
    return VideoGenerator.instance;
  }

  /**
   * Generate a video with specified options
   */
  async generateVideo(options: VideoGenerationOptions, outputPath: string): Promise<string> {
    // Validate options
    this.validateOptions(options);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Check if FFmpeg is available
    if (!(await this.checkFFmpegAvailable())) {
      throw new Error('FFmpeg is required but not found. Please install FFmpeg.');
    }

    // Generate video using FFmpeg
    return await this.generateWithFFmpeg(options, outputPath);
  }

  /**
   * Generate multiple video variants for responsive design
   */
  async generateResponsiveVideos(
    baseOptions: VideoGenerationOptions,
    outputDir: string,
    sizes: Array<{ width: number; height: number; suffix: string }>
  ): Promise<string[]> {
    const generatedVideos: string[] = [];

    for (const size of sizes) {
      const options = {
        ...baseOptions,
        width: size.width,
        height: size.height,
      };

      const outputPath = path.join(outputDir, `video_${size.suffix}.${options.format}`);
      const generatedPath = await this.generateVideo(options, outputPath);
      generatedVideos.push(generatedPath);
    }

    return generatedVideos;
  }

  /**
   * Generate provider-optimized video
   */
  async generateForProvider(
    provider: string,
    baseOptions: VideoGenerationOptions,
    outputPath: string
  ): Promise<string> {
    const optimizedOptions = this.applyProviderOptimizations(provider, baseOptions);
    return await this.generateVideo(optimizedOptions, outputPath);
  }

  /**
   * Validate video generation options
   */
  private validateOptions(options: VideoGenerationOptions): void {
    if (options.width <= 0 || options.height <= 0) {
      throw new Error('Video dimensions must be positive');
    }

    if (options.duration <= 0) {
      throw new Error('Video duration must be positive');
    }

    if (options.fps <= 0) {
      throw new Error('FPS must be positive');
    }

    if (!['mp4', 'webm'].includes(options.format)) {
      throw new Error('Unsupported video format. Use mp4 or webm.');
    }
  }

  /**
   * Apply provider-specific optimizations
   */
  private applyProviderOptimizations(
    provider: string,
    options: VideoGenerationOptions
  ): VideoGenerationOptions {
    const optimized = { ...options };

    switch (provider) {
      case 'pallycon':
        // PallyCon/DoveRunner optimizations
        optimized.codec = 'h264';
        optimized.format = 'mp4';
        optimized.bitrate = optimized.bitrate || 100; // Low bitrate for blank video
        break;

      case 'axinom':
        // Axinom DRM-X optimizations
        optimized.codec = 'h264';
        optimized.format = 'mp4';
        optimized.bitrate = optimized.bitrate || 150;
        break;

      case 'ezdrm':
        // EzDRM optimizations
        optimized.codec = 'h264';
        optimized.format = 'mp4';
        optimized.bitrate = optimized.bitrate || 100;
        break;

      case 'clearkey':
        // ClearKey optimizations (for testing)
        optimized.codec = 'h264';
        optimized.format = 'mp4';
        optimized.bitrate = optimized.bitrate || 50; // Very low bitrate for testing
        break;

      default:
        // Default optimizations
        optimized.codec = optimized.codec || 'h264';
        optimized.bitrate = optimized.bitrate || 100;
    }

    return optimized;
  }

  /**
   * Generate video using FFmpeg
   */
  private async generateWithFFmpeg(
    options: VideoGenerationOptions,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const colorInput = this.generateColorInput(options.color, options.alphaChannel);
      const codec = this.getCodecForFormat(options.format, options.codec);

      const ffmpegArgs = [
        '-f',
        'lavfi',
        '-i',
        `${colorInput}:s=${options.width}x${options.height}:r=${options.fps}`,
        '-t',
        options.duration.toString(),
        '-c:v',
        codec,
        '-pix_fmt',
        options.alphaChannel ? 'yuva420p' : 'yuv420p',
      ];

      // Add bitrate if specified
      if (options.bitrate) {
        ffmpegArgs.push('-b:v', `${options.bitrate}k`);
      }

      // Add format-specific options
      if (options.format === 'mp4') {
        ffmpegArgs.push('-movflags', '+faststart');
      }

      ffmpegArgs.push('-y', outputPath);

      drmLogger.info(`Generating ${options.width}x${options.height} ${options.color} video...`);
      drmLogger.debug(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      let stderr = '';

      ffmpeg.stderr.on('data', data => {
        stderr += data.toString();
      });

      ffmpeg.on('close', code => {
        if (code === 0) {
          drmLogger.info(`✅ Video generated successfully: ${outputPath}`);
          resolve(outputPath);
        } else {
          drmLogger.error(`❌ FFmpeg failed with code ${code}`);
          drmLogger.error(`Error output: ${stderr}`);
          reject(new Error(`FFmpeg process failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', error => {
        reject(new Error(`Failed to start FFmpeg: ${error.message}`));
      });
    });
  }

  /**
   * Generate color input string for FFmpeg
   */
  private generateColorInput(color: string, alphaChannel?: boolean): string {
    const colorMap: Record<string, string> = {
      white: 'color=c=white',
      black: 'color=c=black',
      red: 'color=c=red',
      green: 'color=c=green',
      blue: 'color=c=blue',
      yellow: 'color=c=yellow',
      cyan: 'color=c=cyan',
      magenta: 'color=c=magenta',
      gray: 'color=c=gray',
      transparent: 'color=c=black@0.0',
    };

    // Handle alpha channel for transparency
    if (alphaChannel && color !== 'transparent') {
      return `color=c=${color}@0.8`; // Semi-transparent
    }

    // Check if color is in the map
    if (color in colorMap) {
      return colorMap[color];
    }

    // Check if it's a hex color
    if (color.startsWith('#')) {
      return `color=c=${color}`;
    }

    // Default to white if color not recognized
    drmLogger.warn(`Unknown color '${color}', defaulting to white`);
    return 'color=c=white';
  }

  /**
   * Get appropriate codec for format
   */
  private getCodecForFormat(format: string, preferredCodec?: string): string {
    if (preferredCodec) {
      return this.mapCodecName(preferredCodec);
    }

    switch (format) {
      case 'mp4':
        return 'libx264';
      case 'webm':
        return 'libvpx-vp9';
      default:
        return 'libx264';
    }
  }

  /**
   * Map codec names to FFmpeg codec names
   */
  private mapCodecName(codec: string): string {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp9: 'libvpx-vp9',
      av1: 'libaom-av1',
    };

    return codecMap[codec] || codec;
  }

  /**
   * Check if FFmpeg is available
   */
  private async checkFFmpegAvailable(): Promise<boolean> {
    return new Promise(resolve => {
      const ffmpeg = spawn('ffmpeg', ['-version']);

      ffmpeg.on('close', code => {
        resolve(code === 0);
      });

      ffmpeg.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Get FFmpeg installation instructions
   */
  static getFFmpegInstructions(): string[] {
    return [
      'FFmpeg is required for video generation. Install it using:',
      '',
      '• macOS: brew install ffmpeg',
      '• Ubuntu/Debian: apt-get install ffmpeg',
      '• Windows: Download from https://ffmpeg.org/download.html',
      '• Or use a package manager like Chocolatey: choco install ffmpeg',
    ];
  }
}
