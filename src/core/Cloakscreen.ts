/**
 * Cloakscreen - Main library class
 *
 * Orchestrates the three-layer DRM protection system to block
 * AI vision models and screenshots from capturing sensitive content.
 */

import { CloakscreenConfig, CloakscreenInstance, DRMStatus } from '../types';
import { LayerManager } from './LayerManager';
import { DRMManager } from './DRMManager';
import { ContentManager } from './ContentManager';
import EventEmitter from '../utils/EventEmitter';
import { validateConfig } from '../utils/validation';
import { detectBrowserCapabilities } from '../utils/browser';
import { autoLoadDependencies, checkDependencies } from '../utils/cdn';
import { detectHardwareAcceleration } from '../utils/hardware-acceleration';
import { initializeTamperProtection } from '../utils/tamper-detection';
import { ErrorHandler, ErrorFactory, ErrorCode } from '../errors';
import { coreLogger } from '../utils/logger';
import { VERSION, API_VERSION } from '../version';

/**
 * Main Cloakscreen class for content protection
 *
 * Cloakscreen uses browser DRM APIs to create a three-layer protection system that:
 * - Blocks AI vision models from reading content
 * - Prevents screenshots from capturing sensitive information
 * - Maintains perfect readability for human users
 *
 * @example
 * ```typescript
 * const cloak = new Cloakscreen({
 *   element: '#protected-content',
 *   provider: 'pallycon',
 *   security: {
 *     fallbackMode: 'blur',
 *     debugMode: false
 *   }
 * });
 *
 * await cloak.protect();
 *
 * // Listen for events
 * cloak.on('protected', () => logger.info('Content is now protected'));
 * cloak.on('error', (error) => logger.error('Protection failed:', error));
 * ```
 */
export class Cloakscreen extends EventEmitter implements CloakscreenInstance {
  private config: CloakscreenConfig;
  private layerManager: LayerManager;
  private drmManager: DRMManager;
  private contentManager: ContentManager;
  private isProtectedState: boolean = false;
  private targetElement: HTMLElement;

  constructor(config: CloakscreenConfig) {
    super();

    // Initialize tamper protection early
    const tamperProtectionEnabled = initializeTamperProtection();
    if (!tamperProtectionEnabled && config.options?.debug) {
      coreLogger.warn('Tamper protection initialization failed');
    }

    // Validate configuration
    this.config = validateConfig(config);

    // Resolve target element
    this.targetElement = this.resolveTargetElement(config.element);

    // Initialize managers
    this.layerManager = new LayerManager(this.targetElement, this.config);
    this.drmManager = new DRMManager(this.config.provider);
    this.contentManager = new ContentManager(this.config.options);

    // Setup event forwarding
    this.setupEventForwarding();

    if (this.config.options?.debug) {
      coreLogger.debug('Initialized with config:', this.config);
    }
  }

  /**
   * Protect the content by activating the three-layer DRM system
   */
  async protect(): Promise<void> {
    try {
      if (this.isProtectedState) {
        coreLogger.warn('Content is already protected');
        return;
      }

      this.emit('protection-starting');

      // Auto-load dependencies if needed
      const deps = checkDependencies();
      if (!deps.available) {
        if (this.config.options?.debug) {
          coreLogger.info('Auto-loading dependencies:', deps.missing);
        }
        await autoLoadDependencies();
      }

      // Check browser capabilities
      const browserCapabilities = detectBrowserCapabilities();
      if (!browserCapabilities.supportsEME) {
        throw ErrorFactory.drm(
          ErrorCode.DRM_NOT_SUPPORTED,
          'protect',
          'DRM is not supported in this browser or environment'
        );
      }

      // Check hardware acceleration with more lenient requirements
      const hardwareAcceleration = await detectHardwareAcceleration();

      if (!hardwareAcceleration.available) {
        coreLogger.warn('Hardware acceleration not available, proceeding with reduced security', {
          failureReasons: hardwareAcceleration.failureReasons,
          confidence: hardwareAcceleration.confidence,
        });
      }

      if (this.config.options?.debug) {
        coreLogger.debug('Hardware acceleration status:', {
          available: hardwareAcceleration.available,
          confidence: hardwareAcceleration.confidence,
          tests: hardwareAcceleration.tests,
          gpu: hardwareAcceleration.gpu,
          tamperDetection: hardwareAcceleration.tamperDetection,
        });

        if (hardwareAcceleration.tamperDetection?.tampered) {
          coreLogger.warn('Tampering detected:', hardwareAcceleration.tamperDetection.violations);
        }
      }

      // Initialize DRM
      await this.drmManager.initialize(hardwareAcceleration);
      const drmStatus = this.drmManager.getStatus();

      if (!drmStatus.supported) {
        await this.handleDRMFallback();
        return;
      }

      // Setup layers (unless skipped)
      // Always create layers in simplified config
      await this.layerManager.createLayers();

      // Initialize content
      await this.contentManager.initialize(this.layerManager);

      // Start DRM protection
      const drmTarget = this.layerManager.getMiddleLayer();
      await this.drmManager.startProtection(drmTarget);

      this.isProtectedState = true;
      this.emit('protected', { drmStatus });

      if (this.config.options?.debug) {
        coreLogger.info('Protection activated successfully', {
          version: VERSION,
          apiVersion: API_VERSION,
        });
      }
    } catch (error) {
      const cloakError = ErrorHandler.handle(error as Error, 'protect');
      this.emit('drm-error', { error: cloakError });
      await this.handleDRMFallback();
      throw cloakError;
    }
  }

  /**
   * Remove protection and restore normal content display
   */
  unprotect(): void {
    try {
      if (!this.isProtectedState) {
        coreLogger.warn('Content is not currently protected');
        return;
      }

      // Stop DRM protection
      this.drmManager.stopProtection();

      // Remove layers
      this.layerManager.removeLayers();

      // Reset content
      this.contentManager.reset();

      this.isProtectedState = false;
      this.emit('unprotected');

      if (this.config.options?.debug) {
        coreLogger.info('Protection removed');
      }
    } catch (error) {
      coreLogger.error('Error during unprotect:', error);
      this.emit('error', { error });
    }
  }

  /**
   * Update the protected content
   */
  updateContent(content: string): void {
    if (!this.isProtectedState) {
      throw ErrorFactory.configuration(
        ErrorCode.CONTENT_NOT_PROTECTED,
        'updateContent',
        'Content is not currently protected',
        { currentState: 'not_protected' }
      );
    }

    this.contentManager.updateContent(content);
    this.emit('content-changed', { content });
  }

  /**
   * Get current content
   */
  getContent(): string {
    return this.contentManager.getContent();
  }

  /**
   * Check if content is currently protected
   */
  isProtected(): boolean {
    return this.isProtectedState;
  }

  /**
   * Get current DRM status
   */
  getDRMStatus(): DRMStatus {
    return this.drmManager.getStatus();
  }

  /**
   * Destroy the Cloakscreen instance and cleanup resources
   */
  destroy(): void {
    try {
      // Unprotect if currently protected
      if (this.isProtectedState) {
        this.unprotect();
      }

      // Cleanup managers
      this.drmManager.destroy();
      this.layerManager.destroy();
      this.contentManager.destroy();

      // Remove all event listeners
      this.removeAllListeners();

      if (this.config.options?.debug) {
        coreLogger.info('Instance destroyed');
      }
    } catch (error) {
      coreLogger.error('Error during destroy:', error);
    }
  }

  /**
   * Resolve target element from selector or HTMLElement
   */
  private resolveTargetElement(element: string | HTMLElement): HTMLElement {
    if (typeof element === 'string') {
      const found = document.querySelector(element) as HTMLElement;
      if (!found) {
        throw ErrorFactory.configuration(
          ErrorCode.CONTENT_NOT_FOUND,
          'resolveTargetElement',
          `Element not found: ${element}`,
          { selector: element }
        );
      }
      return found;
    }

    if (!(element instanceof HTMLElement)) {
      throw ErrorFactory.configuration(
        ErrorCode.INVALID_INPUT,
        'resolveTargetElement',
        'Invalid element type provided',
        { elementType: typeof element }
      );
    }

    return element;
  }

  /**
   * Setup event forwarding from managers
   */
  private setupEventForwarding(): void {
    // Forward DRM events
    this.drmManager.on('drm-ready', (data: any) => this.emit('drm-ready', data));
    this.drmManager.on('drm-error', (data: any) => this.emit('drm-error', data));

    // Forward content events
    this.contentManager.on('content-changed', (data: any) => this.emit('content-changed', data));

    // Forward security events
    this.layerManager.on('security-violation', (data: any) =>
      this.emit('security-violation', data)
    );
  }

  /**
   * Handle DRM fallback when DRM is not available
   */
  private async handleDRMFallback(): Promise<void> {
    const fallbackMode = this.config.options?.fallbackMode || 'blur';

    this.emit('fallback-activated', { mode: fallbackMode });

    switch (fallbackMode) {
      case 'blur':
        this.targetElement.style.filter = 'blur(10px)';
        break;
      case 'hide':
        this.targetElement.style.display = 'none';
        break;
      case 'placeholder':
        this.targetElement.innerHTML = '<div>Content protected - DRM not available</div>';
        break;
      case 'none':
        // Do nothing - show content unprotected
        break;
    }

    if (this.config.options?.debug) {
      coreLogger.warn(`DRM not available, using fallback: ${fallbackMode}`);
    }
  }
}
