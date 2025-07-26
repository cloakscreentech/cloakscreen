/**
 * ContentAdapter - Base class for content type adapters
 *
 * Provides common interface for different content types
 * and handles the core layer synchronization logic.
 */

// ContentConfig removed - using simplified options structure
import { utilsLogger } from '../utils/logger';
import EventEmitter from '../utils/EventEmitter';
import { LayerManager } from '../core/LayerManager';

export abstract class ContentAdapter extends EventEmitter {
  protected layerManager: LayerManager | null = null;
  protected config: { content?: string; readOnly?: boolean } | undefined;
  protected topElement: HTMLElement | null = null;
  protected bottomElement: HTMLElement | null = null;

  /**
   * Initialize the adapter with layer manager and configuration
   */
  async initialize(
    layerManager: LayerManager,
    config?: { content?: string; readOnly?: boolean }
  ): Promise<void> {
    this.layerManager = layerManager;
    this.config = config;

    // Get layer elements
    this.topElement = layerManager.getTopLayer();
    this.bottomElement = layerManager.getBottomLayer();

    if (!this.topElement || !this.bottomElement) {
      throw new Error('Layer elements not available');
    }

    // Initialize content elements
    await this.initializeContent();

    // Setup synchronization
    this.setupSynchronization();
  }

  /**
   * Update content in both layers
   */
  updateContent(content: string): void {
    this.updateTopLayer(content);
    this.updateBottomLayer(content);
    this.emit('content-changed', { content });
  }

  /**
   * Destroy the adapter and cleanup resources
   */
  destroy(): void {
    this.cleanup();
    this.removeAllListeners();
  }

  /**
   * Initialize content elements - to be implemented by subclasses
   */
  protected abstract initializeContent(): Promise<void>;

  /**
   * Update top layer content - to be implemented by subclasses
   */
  protected abstract updateTopLayer(content: string): void;

  /**
   * Update bottom layer content - to be implemented by subclasses
   */
  protected abstract updateBottomLayer(content: string): void;

  /**
   * Setup synchronization between layers - to be implemented by subclasses
   */
  protected abstract setupSynchronization(): void;

  /**
   * Cleanup resources - to be implemented by subclasses
   */
  protected abstract cleanup(): void;

  /**
   * Apply per-character background effect to bottom layer
   */
  protected applyInvisibleTextEffect(element: HTMLElement): void {
    // Create per-character background colors matching each character's text color
    // This ensures multicolor text gets proper per-character backgrounds instead of long black rows
    const blackColor = '#000000';

    // Get the original top layer element to read colors from
    const topElement = this.topElement;

    // Apply to all text elements
    this.applyBlackRectangleStyleRecursive(element, blackColor, topElement);
  }

  /**
   * Recursively apply per-character background styling to text elements
   */
  private applyBlackRectangleStyleRecursive(
    element: HTMLElement,
    blackColor: string,
    topElement?: HTMLElement | null
  ): void {
    // Apply to current element if it contains text
    if (element.childNodes.length > 0) {
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          // Apply per-character background colors
          this.applyPerCharacterBackground(
            child,
            child.parentNode as HTMLElement,
            blackColor,
            topElement
          );
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childElement = child as HTMLElement;

          // Don't apply background to the element itself - let per-character handling do it
          childElement.style.color = 'transparent';
          // Remove any existing background color to let per-character backgrounds show
          childElement.style.backgroundColor = 'transparent';

          // Recurse into child elements
          this.applyBlackRectangleStyleRecursive(childElement, blackColor, topElement);
        }
      }
    }
  }

  /**
   * Apply per-character background colors based on the character's original color
   */
  private applyPerCharacterBackground(
    textNode: Node,
    parentElement: HTMLElement,
    fallbackColor: string,
    topElement?: HTMLElement | null
  ): void {
    const text = textNode.textContent || '';
    if (!text.trim()) return;

    // Try to find the corresponding element in the top layer to get the original color
    let originalTextColor = fallbackColor;

    if (topElement) {
      // Find the corresponding element in the top layer by matching text content
      const correspondingElement = this.findCorrespondingElement(topElement, parentElement, text);
      if (correspondingElement) {
        const computedStyle = window.getComputedStyle(correspondingElement);
        originalTextColor = computedStyle.color;
      }
    }

    // Debug: log the detected color
    utilsLogger.debug('Detected color for text:', text.trim(), 'Color:', originalTextColor);

    // Use original text color as background, fallback to black if not available
    const backgroundColor =
      originalTextColor &&
      originalTextColor !== 'rgba(0, 0, 0, 0)' &&
      originalTextColor !== 'transparent'
        ? originalTextColor
        : fallbackColor;

    // Create a container for the character spans
    const container = document.createElement('span');
    container.style.backgroundColor = 'transparent';

    // Split text into individual characters and create spans
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charSpan = document.createElement('span');

      // Set character content
      charSpan.textContent = char;

      // Make text transparent but use the background color
      charSpan.style.color = 'transparent';
      charSpan.style.backgroundColor = backgroundColor;
      charSpan.style.borderRadius = '0px';

      // Preserve whitespace behavior
      if (char === ' ') {
        charSpan.style.backgroundColor = 'transparent';
      }

      container.appendChild(charSpan);
    }

    // Replace the text node with our character spans
    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(container, textNode);
    }
  }

  /**
   * Synchronize scroll position between layers
   */
  protected synchronizeScroll(sourceElement: HTMLElement, targetElement: HTMLElement): void {
    sourceElement.addEventListener('scroll', () => {
      targetElement.scrollTop = sourceElement.scrollTop;
      targetElement.scrollLeft = sourceElement.scrollLeft;
    });
  }

  /**
   * Find the corresponding element in the top layer that contains the same text
   */
  private findCorrespondingElement(
    topElement: HTMLElement,
    bottomElement: HTMLElement,
    text: string
  ): HTMLElement | null {
    // Simple approach: find all elements with the same text content in the top layer
    const walker = document.createTreeWalker(topElement, NodeFilter.SHOW_TEXT);

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent?.trim() === text.trim() && node.parentElement) {
        return node.parentElement;
      }
    }

    // Fallback: try to find by tag name and position
    const bottomTagName = bottomElement.tagName;
    const topElements = topElement.getElementsByTagName(bottomTagName);

    // Find the element with matching text content
    for (let i = 0; i < topElements.length; i++) {
      const element = topElements[i] as HTMLElement;
      if (element.textContent?.includes(text.trim())) {
        return element;
      }
    }

    return null;
  }

  /**
   * Get background color for invisible text effect
   */
  protected getBackgroundColor(element: HTMLElement): string {
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.backgroundColor || '#ffffff';
  }
}
