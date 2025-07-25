/**
 * DRMManager - Manages DRM protection and video playback
 *
 * Handles:
 * - DRM provider initialization
 * - License token management
 * - Video player configuration
 * - Security level detection
 */

import { DRMProviderConfig, DRMStatus, BrowserCapabilities } from '../types';
import EventEmitter from '../utils/EventEmitter';
import { detectBrowserCapabilities } from '../utils/browser';
import { createProvider } from '../providers';
import { HardwareAccelerationStatus } from '../utils/hardware-acceleration';
import { drmLogger } from '../utils/logger';
import { MediaPlayer } from '../types/player';
import { DRMProvider } from '../providers/base/DRMProvider';
import { detectOptimalDRM, DRMDetectionResult, DRMType } from '../utils/drm-detection';

export class DRMManager extends EventEmitter {
  private providerConfig: DRMProviderConfig | string;
  private provider: DRMProvider | null = null;
  private player: MediaPlayer | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private drmStatus: DRMStatus;
  private browserCapabilities: BrowserCapabilities;
  private hardwareAccelerationStatus?: HardwareAccelerationStatus;
  private drmDetectionResult?: DRMDetectionResult;

  constructor(providerConfig: DRMProviderConfig | string) {
    super();
    this.providerConfig = providerConfig;
    this.browserCapabilities = detectBrowserCapabilities();

    // Initialize DRM status
    this.drmStatus = {
      supported: false,
      type: 'none',
      securityLevel: 'unknown',
      hardwareBacked: false,
    };
  }

  /**
   * Initialize DRM system
   */
  async initialize(hardwareAccelerationStatus?: HardwareAccelerationStatus): Promise<void> {
    this.hardwareAccelerationStatus = hardwareAccelerationStatus;
    try {
      // Check browser capabilities
      if (!this.browserCapabilities.supportsEME) {
        throw new Error('Browser does not support EME');
      }

      // Initialize provider
      await this.initializeProvider();

      // Detect DRM capabilities
      await this.detectDRMCapabilities();

      this.emit('drm-ready', { status: this.drmStatus });
    } catch (error) {
      this.drmStatus.supported = false;
      this.emit('drm-error', { error });
      throw error;
    }
  }

  /**
   * Start DRM protection on video element
   */
  async startProtection(layerElement: HTMLElement | null): Promise<void> {
    if (!layerElement) {
      throw new Error('Layer element not provided');
    }

    // Check if the element IS a video element, or find video inside it
    if (layerElement.tagName.toLowerCase() === 'video') {
      this.videoElement = layerElement as HTMLVideoElement;
    } else {
      this.videoElement = layerElement.querySelector('video') as HTMLVideoElement;
    }

    if (!this.videoElement) {
      throw new Error('Video element not found');
    }

    // Initialize Shaka Player
    await this.initializePlayer();

    // Configure DRM
    await this.configureDRM();

    // Load protected content
    await this.loadProtectedContent();
  }

  /**
   * Stop DRM protection
   */
  stopProtection(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    if (this.videoElement) {
      this.videoElement.src = '';
      this.videoElement = null;
    }
  }

  /**
   * Get current DRM status
   */
  getStatus(): DRMStatus {
    // Include hardware acceleration status if available
    if (this.hardwareAccelerationStatus) {
      return {
        ...this.drmStatus,
        hardwareAcceleration: {
          available: this.hardwareAccelerationStatus.available,
          confidence: this.hardwareAccelerationStatus.confidence,
          failureReasons: this.hardwareAccelerationStatus.failureReasons,
        },
      };
    }
    return { ...this.drmStatus };
  }

  /**
   * Destroy DRM manager
   */
  destroy(): void {
    this.stopProtection();

    if (this.provider && this.provider.destroy) {
      this.provider.destroy();
    }

    this.removeAllListeners();
  }

  /**
   * Initialize DRM provider
   */
  private async initializeProvider(): Promise<void> {
    try {
      // Use provider factory to create the appropriate provider
      this.provider = createProvider(this.providerConfig);

      if (this.provider.initialize) {
        await this.provider.initialize();
      }
    } catch (error) {
      drmLogger.error('Failed to initialize DRM provider:', error);
      throw error;
    }
  }

  /**
   * Detect DRM capabilities using enhanced detection system
   */
  private async detectDRMCapabilities(): Promise<void> {
    try {
      // Use enhanced DRM detection
      this.drmDetectionResult = await detectOptimalDRM();

      if (this.drmDetectionResult.primaryDRM === 'none') {
        throw new Error('No supported DRM system found in this environment');
      }

      // Map detection result to DRM status
      this.drmStatus.type = this.mapDRMType(this.drmDetectionResult.primaryDRM);
      this.drmStatus.securityLevel = this.mapSecurityLevel(this.drmDetectionResult.security);
      this.drmStatus.hardwareBacked = this.drmDetectionResult.security.hardwareSecurityAvailable;
      this.drmStatus.supported = true;

      // Log detection results for debugging
      drmLogger.info('DRM Detection Results:', {
        primaryDRM: this.drmDetectionResult.primaryDRM,
        supportedDRMs: this.drmDetectionResult.supportedDRMs,
        browser: this.drmDetectionResult.browser.name,
        platform: this.drmDetectionResult.platform.os,
        securityLevel: this.drmStatus.securityLevel,
        hardwareBacked: this.drmStatus.hardwareBacked,
      });

      // Log recommendations
      if (this.drmDetectionResult.recommendations.length > 0) {
        drmLogger.info('DRM Recommendations:', this.drmDetectionResult.recommendations);
      }
    } catch (error) {
      drmLogger.error('DRM detection failed:', error);
      throw error;
    }
  }

  /**
   * Map DRM detection type to status type
   */
  private mapDRMType(detectedType: DRMType): 'widevine' | 'playready' | 'fairplay' | 'none' {
    switch (detectedType) {
      case 'widevine':
        return 'widevine';
      case 'playready':
        return 'playready';
      case 'fairplay':
        return 'fairplay';
      case 'clearkey':
        return 'none'; // ClearKey is not a production DRM
      case 'none':
      default:
        return 'none';
    }
  }

  /**
   * Map security capabilities to security level
   */
  private mapSecurityLevel(
    security: DRMDetectionResult['security']
  ): 'L1' | 'L2' | 'L3' | 'unknown' {
    if (security.widevineSecurityLevel !== 'unknown') {
      return security.widevineSecurityLevel;
    }

    // For FairPlay, assume hardware-backed security
    if (security.fairplayAvailable) {
      return 'L1';
    }

    // For PlayReady, determine based on security level
    if (security.playreadySecurityLevel) {
      if (security.playreadySecurityLevel.includes('3000')) {
        return 'L1'; // SL3000 is hardware-backed
      }
      return 'L3'; // Standard PlayReady
    }

    return 'unknown';
  }

  // Widevine security level detection now handled by the EME module

  /**
   * Initialize Shaka Player
   */
  private async initializePlayer(): Promise<void> {
    if (!this.videoElement) {
      throw new Error('Video element not available');
    }

    // Check if Shaka Player is available
    if (typeof (window as any).shaka === 'undefined') {
      throw new Error('Shaka Player not loaded');
    }

    // Install polyfills
    (window as any).shaka.polyfill.installAll();

    // Check browser support
    if (!(window as any).shaka.Player.isBrowserSupported()) {
      throw new Error('Browser not supported by Shaka Player');
    }

    // Create player instance
    this.player = new (window as any).shaka.Player(this.videoElement);

    // Setup error handling
    if (this.player) {
      this.player.addEventListener('error', event => {
        this.emit('drm-error', { error: event.detail });
      });
    }
  }

  /**
   * Configure DRM settings
   */
  private async configureDRM(): Promise<void> {
    if (!this.player || !this.provider) {
      throw new Error('Player or provider not initialized');
    }

    // Use the provider's configurePlayer method instead of our own broken config
    if (this.provider.configurePlayer) {
      await this.provider.configurePlayer(this.player);
    } else {
      throw new Error('Provider does not support player configuration');
    }
  }

  /**
   * Load protected content
   */
  private async loadProtectedContent(): Promise<void> {
    if (!this.player || !this.provider) {
      throw new Error('Player or provider not initialized');
    }

    // Get content URL from provider
    const contentUrl = await this.provider.getContentUrl();

    // Load manifest
    await this.player.load(contentUrl);

    // Start playback (gracefully handle autoplay restrictions)
    if (this.videoElement) {
      this.videoElement.play().catch(error => {
        drmLogger.warn('Autoplay prevented:', error);
        // This is expected behavior in modern browsers - not an error
      });
    }
  }
}
