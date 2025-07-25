/**
 * Player-related type definitions
 *
 * Provides proper typing for media players (primarily Shaka Player)
 * to replace generic 'any' types throughout the codebase.
 */

/**
 * Generic media player interface
 */
export interface MediaPlayer {
  /** Load content from a URL */
  load(url: string): Promise<void>;

  /** Configure the player with options */
  configure(config: PlayerConfig): void;

  /** Add event listener */
  addEventListener(type: string, listener: (event: PlayerEvent) => void): void;

  /** Remove event listener */
  removeEventListener(type: string, listener: (event: PlayerEvent) => void): void;

  /** Get networking engine for request/response filtering */
  getNetworkingEngine(): NetworkingEngine;

  /** Destroy the player and cleanup resources */
  destroy(): Promise<void>;

  /** Check if the player is currently loading */
  isLoading(): boolean;

  /** Get current playback state */
  getPlaybackState(): PlaybackState;
}

/**
 * Player configuration interface
 */
export interface PlayerConfig {
  /** DRM configuration */
  drm?: {
    /** License servers for different key systems */
    servers?: Record<string, string>;

    /** Advanced DRM configuration */
    advanced?: Record<string, DRMAdvancedConfig>;

    /** Retry parameters */
    retryParameters?: RetryParameters;
  };

  /** Streaming configuration */
  streaming?: {
    /** Buffer configuration */
    bufferingGoal?: number;
    rebufferingGoal?: number;
    bufferBehind?: number;
  };

  /** Manifest configuration */
  manifest?: {
    /** Retry parameters for manifest requests */
    retryParameters?: RetryParameters;
  };

  /** Allow additional configuration properties */
  [key: string]: unknown;
}

/**
 * Advanced DRM configuration for specific key systems
 */
export interface DRMAdvancedConfig {
  /** License server URL */
  licenseServerUri?: string;

  /** Server certificate */
  serverCertificate?: Uint8Array;

  /** Individual license servers */
  individualizationServer?: string;

  /** Audio robustness level */
  audioRobustness?: string;

  /** Video robustness level */
  videoRobustness?: string;

  /** Persistent state required */
  persistentState?: 'required' | 'optional' | 'not-allowed';

  /** Distinctive identifier required */
  distinctiveIdentifier?: 'required' | 'optional' | 'not-allowed';

  /** Legacy properties for compatibility */
  persistentStateRequired?: boolean;
  serverCertificateUri?: string;
}

/**
 * Retry parameters for network requests
 */
export interface RetryParameters {
  /** Maximum number of retry attempts */
  maxAttempts?: number;

  /** Base delay between retries in milliseconds */
  baseDelay?: number;

  /** Backoff factor for exponential backoff */
  backoffFactor?: number;

  /** Fuzz factor for retry timing */
  fuzzFactor?: number;

  /** Timeout for each attempt in milliseconds */
  timeout?: number;
}

/**
 * Player event interface
 */
export interface PlayerEvent {
  /** Event type */
  type: string;

  /** Event target */
  target: MediaPlayer;

  /** Additional event data */
  detail?: unknown;

  /** Error information (for error events) */
  error?: Error;
}

/**
 * Networking engine interface for request/response filtering
 */
export interface NetworkingEngine {
  /** Register a request filter */
  registerRequestFilter(filter: RequestFilter): void;

  /** Register a response filter */
  registerResponseFilter(filter: ResponseFilter): void;

  /** Unregister a request filter */
  unregisterRequestFilter(filter: RequestFilter): void;

  /** Unregister a response filter */
  unregisterResponseFilter(filter: ResponseFilter): void;
}

/**
 * Request filter function type
 */
export type RequestFilter = (type: RequestType, request: NetworkRequest) => void | Promise<void>;

/**
 * Response filter function type
 */
export type ResponseFilter = (type: RequestType, response: NetworkResponse) => void | Promise<void>;

/**
 * Network request types
 */
export enum RequestType {
  MANIFEST = 'manifest',
  SEGMENT = 'segment',
  LICENSE = 'license',
  APP = 'app',
  TIMING = 'timing',
}

/**
 * Network request interface
 */
export interface NetworkRequest {
  /** Request URL */
  uris: string[];

  /** HTTP method */
  method: string;

  /** Request body */
  body?: ArrayBuffer;

  /** Request headers */
  headers: Record<string, string>;

  /** Allow credentials */
  allowCrossSiteCredentials?: boolean;

  /** Retry parameters */
  retryParameters?: RetryParameters;
}

/**
 * Network response interface
 */
export interface NetworkResponse {
  /** Response URL */
  uri: string;

  /** Original request URL */
  originalUri: string;

  /** Response data */
  data: ArrayBuffer;

  /** Response headers */
  headers: Record<string, string>;

  /** HTTP status code */
  status?: number;

  /** Whether the request was from cache */
  fromCache?: boolean;
}

/**
 * Player playback states
 */
export enum PlaybackState {
  IDLE = 'idle',
  LOADING = 'loading',
  BUFFERING = 'buffering',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
}
