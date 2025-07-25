/**
 * Shaka Player type definitions
 */

declare global {
  interface Window {
    shaka: {
      Player: {
        new (video: HTMLVideoElement): ShakaPlayer;
        isBrowserSupported(): boolean;
      };
      polyfill: {
        installAll(): void;
      };
      net: {
        NetworkingEngine: {
          RequestType: {
            LICENSE: string;
          };
        };
      };
    };
  }
}

interface ShakaPlayer {
  addEventListener(type: string, listener: (event: any) => void): void;
  configure(config: any): void;
  getNetworkingEngine(): {
    registerRequestFilter(filter: (type: any, request: any) => void): void;
  };
  load(manifestUri: string): Promise<void>;
  destroy(): Promise<void>;
}

export {};
