/**
 * PallyConProvider - PallyCon DRM integration
 *
 * Handles PallyCon-specific DRM configuration, license token
 * generation, and content protection setup.
 */

import { DRMProvider } from '../base/DRMProvider';
import { PallyConConfig, PallyConTokenRequest, PallyConTokenResponse } from './types';
import { DRMCapabilities, ProviderMetadata, ProviderHealth } from '../base/types';
import { getProviderDefaults } from '../base/ProviderDefaults';
import { KeySystem } from '../../utils/eme';
import { validatePallyConConfig, PallyConConfigSchema } from './config';
import { configurationManager } from '../base/ConfigurationManager';
import { providerLogger } from '../../utils/logger';
import { MediaPlayer } from '../../types/player';
import { detectOptimalDRM, DRMDetectionResult, DRMType } from '../../utils/drm-detection';

export class PallyConProvider extends DRMProvider {
  private pallyConConfig: PallyConConfig;
  private currentToken: string | null = null;
  private supportL1 = false;
  private supportSL3000 = false;
  private currentDrmType: 'Widevine' | 'PlayReady' | 'FairPlay' = 'Widevine';
  private browserType: string = 'Unknown';
  private drmDetectionResult?: DRMDetectionResult;

  constructor(config: Partial<PallyConConfig>) {
    // Add name to config for base class
    const configWithName = { ...config, name: 'pallycon' };
    super(configWithName);

    // Register configuration schema
    configurationManager.registerSchema('pallycon', PallyConConfigSchema);

    // Validate and transform configuration
    this.pallyConConfig = validatePallyConConfig(config);
    this.validateConfig();
  }

  /**
   * Get provider metadata
   */
  static getMetadata(): ProviderMetadata {
    const defaults = getProviderDefaults('pallycon');

    return {
      name: 'pallycon',
      displayName: 'PallyCon DRM',
      description: 'Multi-DRM solution by PallyCon supporting Widevine, PlayReady, and FairPlay',
      supportedKeySystems: [KeySystem.WIDEVINE, KeySystem.PLAYREADY, KeySystem.FAIRPLAY],
      requiredConfig: defaults.requiredFields,
    };
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): DRMCapabilities {
    return {
      keySystems: [KeySystem.WIDEVINE, KeySystem.PLAYREADY, KeySystem.FAIRPLAY],
      requiresHardwareSecurity: false,
    };
  }

  /**
   * Get provider health status
   */
  async getHealthStatus(): Promise<ProviderHealth> {
    try {
      // Check license server connectivity
      const licenseServerResponse = await fetch(this.getLicenseServerUrl(), {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      if (!licenseServerResponse.ok) {
        return {
          status: 'error',
          error: `License server unreachable (${licenseServerResponse.status})`,
        };
      }

      // Check token endpoint connectivity
      const tokenResponse = await fetch(this.pallyConConfig.tokenEndpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      if (!tokenResponse.ok) {
        return {
          status: 'error',
          error: `Token endpoint unreachable (${tokenResponse.status})`,
        };
      }

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'error',
        error: `Health check failed: ${error}`,
      };
    }
  }

  /**
   * Initialize PallyCon provider
   */
  async initialize(): Promise<void> {
    try {
      // Use enhanced DRM detection system
      await this.performEnhancedDRMDetection();

      // Detect browser capabilities
      await this.detectBrowserCapabilities();

      this.initialized = true;
      this.emit('provider-ready');
    } catch (error) {
      this.emit('provider-error', { error });
      throw error;
    }
  }

  /**
   * Get license token from server
   */
  async getLicenseToken(contentId: string = 'blank'): Promise<string> {
    try {
      const tokenRequest: PallyConTokenRequest = {
        contentId: this.pallyConConfig.contentId || contentId,
        userId: 'demo-user',
        drmType: this.currentDrmType,
      };

      const headers = {
        'Content-Type': 'application/json',
        ...this.pallyConConfig.headers,
      };

      const response = await fetch(this.pallyConConfig.tokenEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(tokenRequest),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }

      const data: PallyConTokenResponse = await response.json();

      if (!data.token) {
        throw new Error('No token received from server');
      }

      return data.token;
    } catch (error) {
      providerLogger.error('Error getting license token:', error);
      throw error;
    }
  }

  /**
   * Get FairPlay certificate (synchronous for compatibility)
   */
  private getFairplayCert(): Uint8Array {
    const fairplayCertUri = this.getCertificateUri();
    let xmlhttp: XMLHttpRequest;

    if ((window as any).XMLHttpRequest) {
      xmlhttp = new XMLHttpRequest();
    } else {
      xmlhttp = new (window as any).ActiveXObject('Microsoft.XMLHTTP');
    }

    xmlhttp.open('GET', fairplayCertUri, false);
    xmlhttp.send();

    if (xmlhttp.status !== 200) {
      throw new Error(`Failed to fetch FairPlay certificate: ${xmlhttp.status}`);
    }

    try {
      // Handle base64 certificate response from fpsKeyManager.do endpoint (matches sample code)
      const responseText = xmlhttp.responseText.trim();

      if (!responseText || responseText.length === 0) {
        throw new Error('Empty FairPlay certificate response');
      }

      // Decode base64 certificate using Shaka utility (matches sample code)
      const fpsCert = (window as any).shaka.util.Uint8ArrayUtils.fromBase64(responseText);
      providerLogger.debug('FairPlay base64 certificate decoded successfully');
      return fpsCert;
    } catch (error) {
      providerLogger.error('Error processing FairPlay certificate:', error);
      throw new Error('Invalid FairPlay certificate format');
    }
  }

  /**
   * Get license server URL
   */
  getLicenseServerUrl(): string {
    return this.pallyConConfig.licenseServer!;
  }

  /**
   * Get content URL - returns the protected content manifest
   */
  async getContentUrl(): Promise<string> {
    // Use manifestUrl from config if provided
    if (this.pallyConConfig.manifestUrl) {
      return this.pallyConConfig.manifestUrl;
    }

    // Route to appropriate content format based on detected DRM type
    if (this.currentDrmType === 'FairPlay') {
      // FairPlay requires HLS content (.m3u8)
      return '/hls_assets/master.m3u8';
    } else {
      // Widevine/PlayReady use DASH content (.mpd)
      return '/dash_assets/stream.mpd';
    }
  }

  /**
   * Get certificate URI based on DRM type
   */
  getCertificateUri(): string {
    if (this.currentDrmType === 'FairPlay') {
      // Use FairPlay certificate endpoint
      return `https://drm-license.doverunner.com/ri/fpsKeyManager.do?siteId=${this.pallyConConfig.siteId}`;
    } else {
      // Use Widevine certificate
      return (
        this.pallyConConfig.certificateUri ||
        `https://license-global.pallycon.com/ri/widevineCert.do?siteId=${this.pallyConConfig.siteId}`
      );
    }
  }

  /**
   * Check if browser is Windows Chrome (for L1 support)
   */
  private isWindowsChrome(): boolean {
    return (
      navigator.userAgent.indexOf('Windows') > -1 && navigator.userAgent.indexOf('Chrome') > -1
    );
  }

  /**
   * Detect browser type and capabilities
   */
  private async detectBrowserCapabilities(): Promise<void> {
    const agent = navigator.userAgent.toLowerCase();
    const name = navigator.appName;

    if (
      name === 'Microsoft Internet Explorer' ||
      agent.includes('trident') ||
      agent.includes('edge/')
    ) {
      this.browserType = agent.includes('edge/') ? 'Edge' : 'IE';
    } else if (agent.includes('safari')) {
      if (agent.includes('opr')) this.browserType = 'Opera';
      else if (agent.includes('whale')) this.browserType = 'Whale';
      else if (agent.includes('edg/') || agent.includes('Edge/')) this.browserType = 'Edge';
      else if (agent.includes('chrome')) this.browserType = 'Chrome';
      else this.browserType = 'Safari';
    } else if (agent.includes('firefox')) {
      this.browserType = 'Firefox';
    }

    providerLogger.info(`Detected browser: ${this.browserType}`);
  }

  /**
   * Perform enhanced DRM detection and configuration
   */
  private async performEnhancedDRMDetection(): Promise<void> {
    try {
      // Get comprehensive DRM detection results
      this.drmDetectionResult = await detectOptimalDRM();

      if (this.drmDetectionResult.primaryDRM === 'none') {
        throw new Error('No supported DRM system found for PallyCon');
      }

      // Set current DRM type based on detection
      this.currentDrmType = this.mapDetectedDRMType(this.drmDetectionResult.primaryDRM);

      // Configure security capabilities based on detection
      await this.configureSecurityCapabilities();

      providerLogger.info('Enhanced DRM Detection Results:', {
        primaryDRM: this.drmDetectionResult.primaryDRM,
        supportedDRMs: this.drmDetectionResult.supportedDRMs,
        selectedDRM: this.currentDrmType,
        browser: this.drmDetectionResult.browser.name,
        platform: this.drmDetectionResult.platform.os,
        hardwareSecurity: this.drmDetectionResult.security.hardwareSecurityAvailable,
      });

      // Log recommendations for optimal setup
      if (this.drmDetectionResult.recommendations.length > 0) {
        providerLogger.info(
          'PallyCon Setup Recommendations:',
          this.drmDetectionResult.recommendations
        );
      }
    } catch (error) {
      providerLogger.error('Enhanced DRM detection failed:', error);
      throw error;
    }
  }

  /**
   * Map detected DRM type to PallyCon DRM type
   */
  private mapDetectedDRMType(detectedType: DRMType): 'Widevine' | 'PlayReady' | 'FairPlay' {
    switch (detectedType) {
      case 'widevine':
        return 'Widevine';
      case 'playready':
        return 'PlayReady';
      case 'fairplay':
        return 'FairPlay';
      case 'clearkey':
        // ClearKey is not supported by PallyCon, fallback to Widevine
        providerLogger.warn(
          'ClearKey detected but not supported by PallyCon, falling back to Widevine'
        );
        return 'Widevine';
      case 'none':
      default:
        throw new Error(`Unsupported DRM type for PallyCon: ${detectedType}`);
    }
  }

  /**
   * Configure security capabilities based on detection results
   */
  private async configureSecurityCapabilities(): Promise<void> {
    if (!this.drmDetectionResult) {
      return;
    }

    const security = this.drmDetectionResult.security;

    // Configure Widevine security levels
    if (this.currentDrmType === 'Widevine') {
      this.supportL1 = security.widevineSecurityLevel === 'L1';

      if (this.supportL1) {
        providerLogger.info('Widevine L1 (hardware-backed) security available');
      } else {
        providerLogger.info(`Widevine security level: ${security.widevineSecurityLevel}`);
      }
    }

    // Configure PlayReady security levels
    if (this.currentDrmType === 'PlayReady' && security.playreadySecurityLevel) {
      this.supportSL3000 = security.playreadySecurityLevel.includes('3000');

      if (this.supportSL3000) {
        providerLogger.info('PlayReady SL3000 (hardware-backed) security available');
      } else {
        providerLogger.info(`PlayReady security level: ${security.playreadySecurityLevel}`);
      }
    }

    // Configure FairPlay (always hardware-backed on Apple devices)
    if (this.currentDrmType === 'FairPlay') {
      providerLogger.info('FairPlay (hardware-backed) security available');
    }
  }

  /**
   * Try to access a key system with given configuration
   */
  private async tryKeySystemAccess(
    keySystem: string,
    config: MediaKeySystemConfiguration[]
  ): Promise<boolean> {
    try {
      await navigator.requestMediaKeySystemAccess(keySystem, config);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create EME config with robustness levels
   */
  private createEmeConfigWithRobustness(
    videoRobustness: string,
    audioRobustness: string
  ): MediaKeySystemConfiguration[] {
    return [
      {
        initDataTypes: ['cenc'],
        videoCapabilities: [
          {
            contentType: 'video/mp4;codecs="avc1.42E01E"',
            robustness: videoRobustness,
          },
        ],
        audioCapabilities: [
          {
            contentType: 'audio/mp4;codecs="mp4a.40.2"',
            robustness: audioRobustness,
          },
        ],
      },
    ];
  }

  /**
   * Get highest security configuration for Widevine
   */
  private async getHighestSecurityConfig(): Promise<{
    widevine: { videoRobustness: string | null; audioRobustness: string | null };
    preferredKeySystems: string[];
    keySystemsMapping: Record<string, string>;
  }> {
    const keySystems = this.isWindowsChrome()
      ? ['com.widevine.alpha.experiment', 'com.widevine.alpha']
      : ['com.widevine.alpha'];

    // Widevine robustness levels in descending order (L1 -> L3)
    const robustnessLevels = [
      'HW_SECURE_ALL', // L1 - Hardware-backed, highest security
      'HW_SECURE_DECODE', // L1 - Hardware decode path
      'HW_SECURE_CRYPTO', // L1 - Hardware crypto
      'SW_SECURE_DECODE', // L3 - Software decode
      'SW_SECURE_CRYPTO', // L3 - Software crypto
    ];

    // Try with robustness levels
    for (const keySystem of keySystems) {
      for (const videoRobustness of robustnessLevels) {
        for (const audioRobustness of robustnessLevels) {
          const succeed = await this.tryKeySystemAccess(
            keySystem,
            this.createEmeConfigWithRobustness(videoRobustness, audioRobustness)
          );

          if (succeed) {
            // Check if we got L1 (hardware-backed) security
            if (
              videoRobustness.startsWith('HW_SECURE_') ||
              audioRobustness.startsWith('HW_SECURE_')
            ) {
              this.supportL1 = true;
              providerLogger.info(
                `Widevine L1 (hardware-backed) security: ${videoRobustness}/${audioRobustness}`
              );
            } else {
              providerLogger.info(
                `Widevine L3 (software) security: ${videoRobustness}/${audioRobustness}`
              );
            }

            const result = {
              widevine: { videoRobustness, audioRobustness },
              preferredKeySystems: keySystems,
              keySystemsMapping: {} as Record<string, string>,
            };

            // Add experimental key system mapping for Windows Chrome L1
            if (this.supportL1 && this.isWindowsChrome()) {
              result.preferredKeySystems = ['com.widevine.alpha.experiment', 'com.widevine.alpha'];
              result.keySystemsMapping = {
                'com.widevine.alpha': 'com.widevine.alpha.experiment',
              };
            }

            return result;
          }
        }
      }
    }

    // Try without robustness if all failed
    const baseConfig = [
      {
        initDataTypes: ['cenc'],
        videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }],
        audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"' }],
      },
    ];

    for (const keySystem of keySystems) {
      const succeed = await this.tryKeySystemAccess(keySystem, baseConfig);
      if (succeed) {
        providerLogger.warn('Only basic Widevine support available (no robustness)');
        return {
          widevine: { videoRobustness: null, audioRobustness: null },
          preferredKeySystems: [keySystem],
          keySystemsMapping: {},
        };
      }
    }

    throw new Error('No Widevine support available');
  }

  /**
   * Configure Shaka Player for PallyCon
   */
  async configurePlayer(player: MediaPlayer): Promise<void> {
    if (!player) {
      throw new Error('Player instance required');
    }

    // Get the license token first and store it on the instance
    this.currentToken = await this.getLicenseToken();

    let config: any = {
      streaming: {
        autoLowLatencyMode: true,
      },
    };

    // Configure based on detected DRM type
    if (this.currentDrmType === 'FairPlay') {
      const fairplayCert = this.getFairplayCert();

      config.drm = {
        servers: {
          'com.apple.fps': this.getLicenseServerUrl(),
        },
        advanced: {
          'com.apple.fps': {
            serverCertificate: fairplayCert,
          },
        },
      };

      // Setup FairPlay-specific request filter
      player.getNetworkingEngine().registerRequestFilter((type, request) => {
        if (type === (window as any).shaka.net.NetworkingEngine.RequestType.LICENSE) {
          if (request.body) {
            try {
              const originalPayload = new Uint8Array(request.body);
              const base64Payload = (window as any).shaka.util.Uint8ArrayUtils.toBase64(
                originalPayload
              );

              // Validate base64 encoding
              if (!base64Payload || base64Payload.length === 0) {
                throw new Error('Failed to encode FairPlay SPC to base64');
              }

              const params = 'spc=' + encodeURIComponent(base64Payload);
              request.body = (window as any).shaka.util.StringUtils.toUTF8(params);
              request.headers['Content-Type'] = 'application/x-www-form-urlencoded';

              providerLogger.debug('FairPlay SPC encoded successfully');
            } catch (error) {
              providerLogger.error('Error encoding FairPlay SPC:', error);
              throw error;
            }
          }
          this.setCustomData(request);
        }
      });

      // Setup FairPlay-specific response filter
      player.getNetworkingEngine().registerResponseFilter((type, response) => {
        if (type === (window as any).shaka.net.NetworkingEngine.RequestType.LICENSE) {
          try {
            const responseText = (window as any).shaka.util.StringUtils.fromUTF8(
              response.data
            ).trim();

            // Validate response text
            if (!responseText || responseText.length === 0) {
              throw new Error('Empty FairPlay license response');
            }

            // Validate base64 format
            if (!responseText.match(/^[A-Za-z0-9+/]+=*$/)) {
              throw new Error('Invalid base64 format in FairPlay license response');
            }

            const decodedResponse = (window as any).shaka.util.Uint8ArrayUtils.fromBase64(
              responseText
            );

            if (!decodedResponse || decodedResponse.length === 0) {
              throw new Error('Failed to decode FairPlay license response');
            }

            response.data = decodedResponse.buffer;
            providerLogger.debug('FairPlay license decoded successfully');
          } catch (error) {
            providerLogger.error('Error processing FairPlay license response:', error);
            throw error;
          }

          this.parsingResponse(response);
        }
      });
    } else {
      // Widevine or PlayReady configuration
      const securityConfig = await this.getHighestSecurityConfig();

      config.drm = {
        servers: {
          'com.widevine.alpha': this.getLicenseServerUrl(),
          'com.microsoft.playready': this.getLicenseServerUrl(),
        },
        advanced: {
          'com.widevine.alpha': {
            persistentStateRequired: true,
            serverCertificateUri: this.getCertificateUri(),
            videoRobustness: securityConfig.widevine.videoRobustness,
            audioRobustness: securityConfig.widevine.audioRobustness,
          },
          'com.microsoft.playready': {
            persistentStateRequired: true,
          },
        },
        preferredKeySystems: securityConfig.preferredKeySystems,
        keySystemsMapping: securityConfig.keySystemsMapping,
      };

      // Add PlayReady SL3000 support if available
      if (this.currentDrmType === 'PlayReady' && this.supportSL3000) {
        config.drm.preferredKeySystems = [
          'com.microsoft.playready.recommendation.3000',
          'com.microsoft.playready.recommendation',
          'com.microsoft.playready',
        ];
        config.drm.keySystemsMapping = {
          'com.microsoft.playready': 'com.microsoft.playready.recommendation.3000',
        };
      }

      // Setup request filter for Widevine/PlayReady
      player.getNetworkingEngine().registerRequestFilter((type, request) => {
        if (type === (window as any).shaka.net.NetworkingEngine.RequestType.LICENSE) {
          this.setCustomData(request);
        }
      });

      // Setup response filter for Widevine/PlayReady
      player.getNetworkingEngine().registerResponseFilter((type, response) => {
        if (type === (window as any).shaka.net.NetworkingEngine.RequestType.LICENSE) {
          this.parsingResponse(response);
        }
      });
    }

    player.configure(config);

    // Setup error handling with SL3000 fallback
    player.addEventListener('error', (event: any) => {
      this.onErrorEvent(event, player);
    });
  }

  /**
   * Set custom data headers for license requests
   */
  private setCustomData(request: any): void {
    if (this.currentDrmType === 'Widevine') {
      request.headers['pallycon-customdata-v2'] = this.currentToken;
    } else if (this.currentDrmType === 'PlayReady') {
      request.headers['pallycon-customdata-v2'] = this.currentToken;
    } else if (this.currentDrmType === 'FairPlay') {
      request.headers['pallycon-customdata-v2'] = this.currentToken;
    }
  }

  /**
   * Parse license response and handle DoveRunner errors
   */
  private parsingResponse(response: any): void {
    // For FairPlay, the response should already be processed by the response filter
    if (this.currentDrmType === 'FairPlay') {
      // FairPlay responses are binary and don't need JSON parsing
      providerLogger.debug('FairPlay license response processed');
      return;
    }

    let responseText: string;

    try {
      responseText = this.arrayBufferToString(response.data);
      responseText = responseText.trim();

      providerLogger.debug('License response:', responseText);

      // Try to parse as JSON for error handling
      const doverunnerObj = JSON.parse(responseText);
      if (doverunnerObj && doverunnerObj.errorCode && doverunnerObj.message) {
        if ('8002' !== doverunnerObj.errorCode) {
          const errorMsg = `DoveRunner Error: ${doverunnerObj.message} (${doverunnerObj.errorCode})`;
          providerLogger.error(errorMsg);
          throw new Error(errorMsg);
        } else {
          const errorObj = JSON.parse(doverunnerObj.message);
          const errorMsg = `Error: ${errorObj.MESSAGE} (${errorObj.ERROR})`;
          providerLogger.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
    } catch (e) {
      // If parsing fails, assume it's a valid license response
      providerLogger.debug('Response parsing failed, assuming valid license');
    }
  }

  /**
   * Handle Shaka Player errors with fallback logic
   */
  private onErrorEvent(event: any, player: MediaPlayer): void {
    const error = event.detail;
    providerLogger.error('Shaka Player error:', error.code, error);

    // Handle PlayReady SL3000 fallback (error code 6006)
    if (error.code === 6006 && this.supportSL3000) {
      providerLogger.warn('SL3000 content incompatible, falling back to standard PlayReady');
      player.destroy();
      this.supportSL3000 = false;

      // Reinitialize player after a short delay
      setTimeout(() => {
        this.configurePlayer(player).catch(err => {
          providerLogger.error('Failed to reinitialize player:', err);
        });
      }, 500);
    }

    this.emit('drm-error', { error });
  }

  /**
   * Convert ArrayBuffer to string
   */
  private arrayBufferToString(buffer: ArrayBuffer): string {
    const arr = new Uint8Array(buffer);
    return String.fromCharCode.apply(String, Array.from(arr));
  }

  /**
   * Destroy provider and cleanup
   */
  destroy(): void {
    this.initialized = false;
    this.removeAllListeners();
  }

  /**
   * Validate provider configuration (implements abstract method)
   */
  validateConfig(): void {
    this.validateBasicConfig();

    // Configuration is already validated by the schema in constructor
    // This method can be used for runtime validation if needed
    const validation = configurationManager.validateConfig('pallycon', this.pallyConConfig);

    if (!validation.valid) {
      throw new Error(`PallyCon configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      providerLogger.warn('Configuration warnings:', validation.warnings);
    }
  }

  /**
   * Test token endpoint connectivity
   */
  // @ts-ignore - Method kept for future use
  private async testTokenEndpoint(): Promise<void> {
    try {
      // Make a test request to verify endpoint is accessible
      const response = await fetch(this.pallyConConfig.tokenEndpoint, {
        method: 'HEAD',
      });

      // Accept any response that's not a network error
      // The actual token request will be made later with proper payload
      providerLogger.debug('Token endpoint test response:', response.status);
    } catch (error) {
      providerLogger.warn('Token endpoint test failed:', error);
      // Don't throw here as the endpoint might not support HEAD requests
    }
  }

  /**
   * Create default PallyCon configuration for self-hosted setup
   */
  static createSelfHostedConfig(siteId: string): PallyConConfig {
    const defaults = getProviderDefaults('pallycon');

    return {
      siteId,
      tokenEndpoint: '/api/get-license-token',
      licenseServer: defaults.licenseServer,
      certificateUri: defaults.certificatePattern?.replace('{siteId}', siteId),
    };
  }

  /**
   * Create PallyCon configuration for cloud setup
   */
  static createCloudConfig(siteId: string, cloudEndpoint: string): PallyConConfig {
    const defaults = getProviderDefaults('pallycon');

    return {
      siteId,
      tokenEndpoint: `${cloudEndpoint}/api/license-token`,
      licenseServer: defaults.licenseServer,
      certificateUri: defaults.certificatePattern?.replace('{siteId}', siteId),
    };
  }
}
