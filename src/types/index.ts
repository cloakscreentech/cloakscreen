/**
 * TypeScript definitions for Cloakscreen library
 */

export interface CloakscreenConfig {
  /** Target element selector or HTMLElement */
  element: string | HTMLElement;

  /** DRM provider configuration */
  provider: DRMProviderConfig | string;

  /** Optional content and behavior settings */
  options?: {
    /** Initial content */
    content?: string;

    /** Read-only mode */
    readOnly?: boolean;

    /** Fallback behavior when DRM fails */
    fallbackMode?: 'blur' | 'hide' | 'placeholder' | 'none';

    /** Enable debug mode */
    debug?: boolean;
  };
}

export interface DRMProviderConfig {
  /** Provider name */
  name: string;

  /** Provider-specific configuration */
  config?: Record<string, unknown>;
}

export interface PallyConConfig extends DRMProviderConfig {
  /** PallyCon Site ID */
  siteId: string;

  /** Token endpoint URL */
  tokenEndpoint: string;
}

export interface DRMStatus {
  /** Is DRM supported */
  supported: boolean;

  /** DRM type */
  type: 'widevine' | 'playready' | 'fairplay' | 'none';

  /** Security level */
  securityLevel: 'L1' | 'L2' | 'L3' | 'unknown';

  /** Is hardware-backed */
  hardwareBacked: boolean;

  /** Hardware acceleration status */
  hardwareAcceleration?: {
    available: boolean;
    confidence: number;
    failureReasons: string[];
  };
}

export interface BrowserCapabilities {
  /** Browser name */
  browser: string;

  /** Supports EME */
  supportsEME: boolean;

  /** Supported key systems */
  supportedKeySystems: string[];

  /** Hardware security support */
  hardwareSecuritySupport: boolean;
}

export interface DRMImplementation {
  /** Initialize DRM */
  initialize(): Promise<void>;

  /** Get license token */
  getLicenseToken(contentId: string): Promise<string>;

  /** Configure player */
  configurePlayer(player: any): void;

  /** Cleanup */
  destroy(): void;
}

export interface CloakscreenInstance {
  /** Protect the content */
  protect(): Promise<void>;

  /** Unprotect the content */
  unprotect(): void;

  /** Update content */
  updateContent(content: string): void;

  /** Get current content */
  getContent(): string;

  /** Check protection status */
  isProtected(): boolean;

  /** Get DRM status */
  getDRMStatus(): DRMStatus;

  /** Destroy instance */
  destroy(): void;

  /** Event listeners */
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

// Clean, focused type definitions for v1.0.0
