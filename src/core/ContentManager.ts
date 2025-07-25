/**
 * ContentManager - Manages content rendering and synchronization
 *
 * Handles:
 * - Content type detection and adaptation
 * - Top/bottom layer synchronization
 * - Content updates and styling
 */

// ContentConfig removed - using simplified options structure
import EventEmitter from '../utils/EventEmitter';
import { LayerManager } from './LayerManager';
import { TextAdapter } from '../adapters/TextAdapter';
import { ContentAdapter } from '../adapters/ContentAdapter';

export class ContentManager extends EventEmitter {
  private contentConfig: { content?: string; readOnly?: boolean } | undefined;
  private adapter: ContentAdapter | null = null;
  private currentContent: string = '';

  constructor(contentConfig?: { content?: string; readOnly?: boolean }) {
    super();
    this.contentConfig = contentConfig;
  }

  /**
   * Initialize content manager with layer manager
   */
  async initialize(layerManager: LayerManager): Promise<void> {
    // Create appropriate adapter
    this.adapter = this.createAdapter();

    // Initialize adapter
    if (this.adapter) {
      await this.adapter.initialize(layerManager, this.contentConfig);

      // Setup event forwarding
      this.adapter.on('content-changed', (data: any) => {
        this.currentContent = data.content;
        this.emit('content-changed', data);
      });
    }

    // Set initial content
    if (this.contentConfig?.content) {
      this.updateContent(this.contentConfig.content);
    }
  }

  /**
   * Update content
   */
  updateContent(content: string): void {
    if (!this.adapter) {
      throw new Error('Content adapter not initialized');
    }

    this.currentContent = content;
    this.adapter.updateContent(content);
  }

  /**
   * Get current content
   */
  getContent(): string {
    return this.currentContent;
  }

  /**
   * Reset content manager
   */
  reset(): void {
    if (this.adapter) {
      this.adapter.destroy();
      this.adapter = null;
    }

    this.currentContent = '';
  }

  /**
   * Destroy content manager
   */
  destroy(): void {
    this.reset();
    this.removeAllListeners();
  }

  /**
   * Create appropriate content adapter based on configuration and environment
   */
  private createAdapter(): ContentAdapter | null {
    // Always use text adapter for simplified configuration
    return new TextAdapter();
  }
}
