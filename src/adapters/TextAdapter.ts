/**
 * TextAdapter - Agnostic text content protection
 *
 * Protects any text content using the color-matching technique.
 * Works with any existing content in the target element.
 */

import { ContentAdapter } from './ContentAdapter';

export class TextAdapter extends ContentAdapter {
  private topContainer: HTMLElement | null = null;
  private bottomContainer: HTMLElement | null = null;
  private isUpdating: boolean = false;
  private originalContent: string = '';

  /**
   * Initialize content containers for both layers
   */
  protected async initializeContent(): Promise<void> {
    if (!this.topElement || !this.bottomElement) {
      throw new Error('Layer elements not available');
    }

    // Get original content from the target element that's being protected
    const targetElement = this.layerManager?.getTargetElement();
    if (targetElement) {
      // Get only the original content, excluding any existing cloakscreen containers
      const originalElements = Array.from(targetElement.children).filter(
        child => !child.classList.contains('cloakscreen-container')
      );

      const tempDiv = document.createElement('div');
      originalElements.forEach(element => {
        tempDiv.appendChild(element.cloneNode(true));
      });

      this.originalContent = tempDiv.innerHTML;
    } else {
      this.originalContent = this.config?.content || '';
    }

    // Create top container (visible, interactive)
    this.topContainer = document.createElement('div');
    this.topContainer.className = 'cloakscreen-top-content';
    this.topContainer.innerHTML = this.originalContent;

    // Remove display: none from all elements in top layer
    this.removeDisplayNone(this.topContainer);

    // Pure cloning - no editing functionality, just exact copy

    // Create bottom container (invisible mirror)
    this.bottomContainer = document.createElement('div');
    this.bottomContainer.className = 'cloakscreen-bottom-content';
    this.bottomContainer.innerHTML = this.originalContent;
    this.bottomContainer.setAttribute('aria-hidden', 'true');
    this.bottomContainer.style.pointerEvents = 'none';

    // Remove display: none from all elements in bottom layer
    this.removeDisplayNone(this.bottomContainer);

    // Apply styling
    this.applyContainerStyling();

    // Add to layers
    this.topElement.appendChild(this.topContainer);
    this.bottomElement.appendChild(this.bottomContainer);
  }

  /**
   * Update content in top layer
   */
  protected updateTopLayer(content: string): void {
    if (this.topContainer && !this.isUpdating) {
      this.isUpdating = true;
      this.topContainer.innerHTML = content;
      this.isUpdating = false;
    }
  }

  /**
   * Update content in bottom layer
   */
  protected updateBottomLayer(content: string): void {
    if (this.bottomContainer && !this.isUpdating) {
      this.bottomContainer.innerHTML = content;

      // Apply invisible text effect
      setTimeout(() => {
        this.applyInvisibleTextEffect(this.bottomContainer!);
      }, 10);
    }
  }

  /**
   * Setup synchronization between content containers
   */
  protected setupSynchronization(): void {
    if (!this.topContainer || !this.bottomContainer) {
      return;
    }

    // Sync content changes from top to bottom
    this.topContainer.addEventListener('input', () => {
      if (!this.isUpdating) {
        const content = this.topContainer!.innerHTML;
        this.updateBottomLayer(content);
        this.emit('content-changed', { content });
      }
    });

    // Sync scroll position
    this.synchronizeScroll(this.topContainer, this.bottomContainer);

    // Apply invisible text effect initially
    setTimeout(() => {
      this.applyInvisibleTextEffect(this.bottomContainer!);
    }, 50);
  }

  /**
   * Apply minimal styling - layers should be exact copies
   */
  private applyContainerStyling(): void {
    // Top container - exact copy of original with minimal styling
    if (this.topContainer) {
      // Only essential styles, no padding/overflow/etc
      this.topContainer.style.backgroundColor = 'transparent';
      this.topContainer.style.color = 'inherit';
      this.topContainer.style.pointerEvents = 'auto'; // Allow interaction

      // No editing functionality - just pure content cloning
    }

    // Bottom container - exact copy but will get black rectangles
    if (this.bottomContainer) {
      this.bottomContainer.style.backgroundColor = 'transparent';
      this.bottomContainer.style.pointerEvents = 'none'; // No interaction
    }

    // Layer elements should have no special styling
    if (this.topElement) {
      this.topElement.style.pointerEvents = 'auto';
    }

    if (this.bottomElement) {
      this.bottomElement.style.pointerEvents = 'none';
    }
  }

  /**
   * Get current content from top container
   */
  getContent(): string {
    return this.topContainer ? this.topContainer.innerHTML : '';
  }

  /**
   * Cloakscreen is always read-only - no editing functionality
   */
  setReadOnly(_readOnly: boolean): void {
    // Cloakscreen content is always read-only for protection
    // This method exists for interface compatibility but does nothing
  }

  /**
   * Focus the content container
   */
  focus(): void {
    if (this.topContainer) {
      this.topContainer.focus();
    }
  }

  /**
   * Remove visibility: hidden and display: none from all elements recursively
   * Also reset margins to prevent double margin issues
   */
  private removeDisplayNone(element: HTMLElement): void {
    // Remove visibility: hidden and display: none from current element
    if (element.style.visibility === 'hidden') {
      element.style.visibility = '';
    }
    if (element.style.display === 'none') {
      element.style.display = '';
    }

    // Recursively remove from all children and reset margins
    const children = element.querySelectorAll('*') as NodeListOf<HTMLElement>;
    children.forEach(child => {
      if (child.style.visibility === 'hidden') {
        child.style.visibility = '';
      }
      if (child.style.display === 'none') {
        child.style.display = '';
      }

      // Reset margins to prevent double margin from original + copy
      const computedStyle = window.getComputedStyle(child);
      if (computedStyle.marginTop && computedStyle.marginTop !== '0px') {
        child.style.marginTop = '0';
      }
      if (computedStyle.marginBottom && computedStyle.marginBottom !== '0px') {
        child.style.marginBottom = '0';
      }
    });

    // Also reset margins on the container itself
    const containerComputedStyle = window.getComputedStyle(element);
    if (containerComputedStyle.marginTop && containerComputedStyle.marginTop !== '0px') {
      element.style.marginTop = '0';
    }
    if (containerComputedStyle.marginBottom && containerComputedStyle.marginBottom !== '0px') {
      element.style.marginBottom = '0';
    }
  }

  /**
   * Cleanup resources
   */
  protected cleanup(): void {
    if (this.topContainer && this.topContainer.parentNode) {
      this.topContainer.parentNode.removeChild(this.topContainer);
      this.topContainer = null;
    }

    if (this.bottomContainer && this.bottomContainer.parentNode) {
      this.bottomContainer.parentNode.removeChild(this.bottomContainer);
      this.bottomContainer = null;
    }
  }
}
