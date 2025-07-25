/**
 * LayerManager - Manages the three-layer protection system
 *
 * Creates and manages:
 * - Top Layer: Visible content with proper styling
 * - Middle Layer: DRM-protected transparent video
 * - Bottom Layer: Invisible content (same color as background)
 */

import { CloakscreenConfig } from '../types';
import EventEmitter from '../utils/EventEmitter';
import { coreLogger } from '../utils/logger';

export class LayerManager extends EventEmitter {
  private targetElement: HTMLElement;
  private config: CloakscreenConfig;
  private containerElement: HTMLElement | null = null;
  private topLayer: HTMLElement | null = null;
  private middleLayer: HTMLElement | null = null;
  private bottomLayer: HTMLElement | null = null;
  // Note: originalContent removed as we now preserve DOM elements directly

  constructor(targetElement: HTMLElement, config: CloakscreenConfig) {
    super();
    this.targetElement = targetElement;
    this.config = config;

    // Note: We now preserve original DOM elements instead of storing innerHTML
  }

  /**
   * Create the three-layer protection system
   */
  async createLayers(): Promise<void> {
    try {
      // Check if element is already protected
      if (this.targetElement.querySelector('.cloakscreen-container')) {
        coreLogger.warn('Element already protected, skipping layer creation');
        return;
      }

      // Debug: Log the config to see what we have
      if (this.config.options?.debug) {
        coreLogger.debug('createLayers called with config:', {
          debug: this.config.options.debug,
        });
      }

      // Always create new layers in simplified configuration
      await this.createNewLayers();

      // Setup layer synchronization
      this.setupLayerSync();

      if (this.config.options?.debug) {
        coreLogger.info('Layers initialized successfully');
      }
    } catch (error) {
      coreLogger.error('Error creating layers:', error);
      throw error;
    }
  }

  /**
   * Use existing layer elements from config
   */

  /**
   * Create new layer system (original behavior)
   */
  private async createNewLayers(): Promise<void> {
    // Create main container
    this.containerElement = this.createContainer();

    // Create layers in order (bottom to top)
    this.bottomLayer = this.createBottomLayer();
    this.middleLayer = this.createMiddleLayer();
    this.topLayer = this.createTopLayer();

    // Append layers to container
    this.containerElement.appendChild(this.bottomLayer);
    this.containerElement.appendChild(this.middleLayer);
    this.containerElement.appendChild(this.topLayer);

    // Hide original content but preserve layout sizing
    const originalElements = Array.from(this.targetElement.children);
    originalElements.forEach(child => {
      if (!child.classList.contains('cloakscreen-container')) {
        (child as HTMLElement).style.visibility = 'hidden';
      }
    });

    // Add container as overlay - back to simple positioning
    this.containerElement.style.position = 'absolute';
    this.containerElement.style.top = '0';
    this.containerElement.style.left = '0';
    this.containerElement.style.width = '100%';
    this.containerElement.style.height = '100%';
    this.containerElement.style.zIndex = '1000';
    this.containerElement.style.pointerEvents = 'none'; // Let top layer handle interactions

    // Make target element relative positioned to contain absolute layers
    // Also add a small border or padding to create a new block formatting context
    // This prevents margin collapse from affecting our container positioning
    if (getComputedStyle(this.targetElement).position === 'static') {
      this.targetElement.style.position = 'relative';
    }

    // Create a new block formatting context to prevent margin collapse issues
    const currentOverflow = getComputedStyle(this.targetElement).overflow;
    if (currentOverflow === 'visible') {
      this.targetElement.style.overflow = 'hidden';
    }

    this.targetElement.appendChild(this.containerElement);
  }

  /**
   * Resolve element from selector or HTMLElement
   */

  /**
   * Remove all layers and restore original content
   */
  removeLayers(): void {
    if (this.containerElement && this.targetElement.contains(this.containerElement)) {
      this.targetElement.removeChild(this.containerElement);

      // Restore original element visibility
      const originalElements = Array.from(this.targetElement.children);
      originalElements.forEach(child => {
        if (!child.classList.contains('cloakscreen-container')) {
          (child as HTMLElement).style.visibility = '';
        }
      });
    }

    this.cleanup();
  }

  /**
   * Get the target element
   */
  getTargetElement(): HTMLElement {
    return this.targetElement;
  }

  /**
   * Get the top layer element
   */
  getTopLayer(): HTMLElement | null {
    return this.topLayer;
  }

  /**
   * Get the middle layer element (DRM video)
   */
  getMiddleLayer(): HTMLElement | null {
    return this.middleLayer;
  }

  /**
   * Get the bottom layer element
   */
  getBottomLayer(): HTMLElement | null {
    return this.bottomLayer;
  }

  /**
   * Update layer content
   */
  updateLayerContent(content: string): void {
    // This will be implemented by specific content adapters
    this.emit('content-update-requested', { content });
  }

  /**
   * Destroy the layer manager
   */
  destroy(): void {
    this.removeLayers();
    this.removeAllListeners();
  }

  /**
   * Create the main container element
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cloakscreen-container';

    // Minimal container styles - no overflow hidden
    Object.assign(container.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
    });

    return container;
  }

  /**
   * Create the top layer (visible content)
   */
  private createTopLayer(): HTMLElement {
    const layer = document.createElement('div');
    layer.className = 'cloakscreen-layer cloakscreen-top-layer';

    this.applyLayerStyles(layer, {
      zIndex: 3,
      opacity: 1,
      visible: true,
    });

    return layer;
  }

  /**
   * Create the middle layer (DRM video)
   */
  private createMiddleLayer(): HTMLElement {
    const layer = document.createElement('div');
    layer.className = 'cloakscreen-layer cloakscreen-middle-layer';

    // Create video element for DRM protection
    const video = document.createElement('video');
    video.id = 'cloakscreen-drm-video';
    video.setAttribute('loop', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('autoplay', 'true');

    // Apply video styles
    Object.assign(video.style, {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      objectFit: 'cover',
    });

    layer.appendChild(video);

    this.applyLayerStyles(layer, {
      zIndex: 2,
      opacity: 1,
      visible: true,
    });

    return layer;
  }

  /**
   * Create the bottom layer (invisible content)
   */
  private createBottomLayer(): HTMLElement {
    const layer = document.createElement('div');
    layer.className = 'cloakscreen-layer cloakscreen-bottom-layer';

    this.applyLayerStyles(layer, {
      zIndex: 1,
      opacity: 1,
      visible: true,
    });

    return layer;
  }

  /**
   * Apply minimal styles to a layer - should be exact copies
   */
  private applyLayerStyles(
    layer: HTMLElement,
    config: { zIndex: number; opacity: number; visible: boolean; styles?: Record<string, string> }
  ): void {
    // Only essential positioning - no flex, centering, etc.
    Object.assign(layer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: config.zIndex.toString(),
      opacity: config.opacity.toString(),
      ...config.styles,
    });
  }

  /**
   * Setup synchronization between layers
   */
  private setupLayerSync(): void {
    // This will be enhanced by content adapters
    // For now, just setup basic event handling

    if (this.topLayer) {
      // Monitor for potential security violations
      this.setupSecurityMonitoring(this.topLayer);
    }
  }

  /**
   * Setup security monitoring for layer tampering
   */
  private setupSecurityMonitoring(layer: HTMLElement): void {
    // Monitor for style changes that might compromise protection
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.emit('security-violation', {
            type: 'style-tampering',
            target: mutation.target,
            oldValue: mutation.oldValue,
          });
        }
      });
    });

    observer.observe(layer, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['style', 'class'],
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.containerElement = null;
    this.topLayer = null;
    this.middleLayer = null;
    this.bottomLayer = null;
  }
}
