# Cloakscreen

> **⚠️ UNDER CONSTRUCTION** - This project is currently in active development and **not ready for production use**. APIs may change, features are incomplete, and documentation is being updated. Please check back soon for the stable release!

**The Open Source DRM-Based AI Vision Blocking Library**

Revolutionary content protection that makes your sensitive text **invisible to AI vision models and screenshots** while keeping it perfectly readable for humans. Uses browser DRM APIs, **hardware acceleration detection**, and **tamper-proof security** with innovative three-layer rendering to create an impenetrable shield against automated content extraction.

[![npm version](https://badge.fury.io/js/cloakscreen.svg)](https://badge.fury.io/js/cloakscreen)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Downloads](https://img.shields.io/npm/dm/cloakscreen.svg)](https://www.npmjs.com/package/cloakscreen)

> **Try it now:** [Live Demo](https://demo.cloakscreen.tech) | **Managed Service:** [Cloakscreen Cloud](https://cloud.cloakscreen.tech)

## Why Cloakscreen?

In an era where AI can read and extract any text from screenshots, traditional content protection falls short. Cloakscreen uses **browser DRM technology** to create a revolutionary three-layer protection system that:

- **Blocks AI Vision Models** from reading your content
- **Prevents Screenshots** from capturing sensitive information
- **Hardware Acceleration Detection** - Ensures DRM security requirements are met
- **Tamper-Proof Security** - Prevents client-side bypass attempts
- **Maintains Perfect Readability** for human users
- **Works Across All Browsers** with DRM support
- **Enhanced Developer Experience** with Valibot-powered validation and helpful error messages

Perfect for protecting:

- **Code Interview Questions** and solutions
- **Exam Content** and assessments
- **Proprietary Documentation** and trade secrets
- **Financial Reports** and sensitive data
- **Legal Documents** and contracts

## 🎮 **Interactive Demos**

Try our live demos to see hardware acceleration detection and tamper-proof security in action:

- **[Basic Protection Demo](examples/basic-protection.html)** - Simple content protection with HTML
- **[React Protection Demo](examples/basic-protection-react.tsx)** - React component integration

## Quick Start

### Option 1: CDN (Zero Setup)

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Required: Shaka Player for DRM -->
    <script src="https://cdn.jsdelivr.net/npm/shaka-player@4.11.17/dist/shaka-player.compiled.min.js"></script>

    <!-- Cloakscreen from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/cloakscreen@latest/dist/cloakscreen.min.js"></script>
  </head>
  <body>
    <div id="content">
      <h2>Protected Content</h2>
      <p>This text will be invisible to AI and screenshots!</p>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', async () => {
        if (window.Cloakscreen && window.Cloakscreen.protect) {
          // Get configuration from server
          const response = await fetch('/api/token/info');
          const config = await response.json();

          await window.Cloakscreen.protect('#content', {
            provider: {
              name: config.info.provider,
              siteId: config.info.siteId,
              tokenEndpoint: config.info.tokenEndpoint,
            },
          });
        }
      });
    </script>
  </body>
</html>
```

### Option 2: NPM Installation

```bash
npm install cloakscreen shaka-player
```

```javascript
import { protect } from 'cloakscreen';

// Auto-detection (zero config) - detects from environment variables
await protect('#sensitive-content');

// PallyCon provider with explicit configuration
await protect('#sensitive-content', {
  provider: {
    name: 'pallycon',
    config: {
      siteId: 'YOUR_SITE_ID',
      tokenEndpoint: '/api/get-license-token',
    },
  },
});

// Using provider factory for advanced configuration
import { createProvider } from 'cloakscreen';

const provider = createProvider({
  name: 'pallycon',
  siteId: 'YOUR_SITE_ID',
  tokenEndpoint: '/api/get-license-token',
  debug: true,
});

await protect('#sensitive-content', { provider });
```

## How It Works

Cloakscreen uses a revolutionary **three-layer sandwich** approach:

```
┌─────────────────────────────────┐
│ TOP LAYER (Invisible Text)      │ ← Human-readable content
│ - Color matches background      │   (invisible during normal viewing)
├─────────────────────────────────┤
│ MIDDLE LAYER (DRM Video)        │ ← DRM-protected transparent video
│ - EME/DRM protected             │   (blocks AI vision, disappears in screenshots)
├─────────────────────────────────┤
│ BOTTOM LAYER (Visible Text)     │ ← Readable content for humans
│ - Normal readable colors        │   (visible through transparent DRM layer)
└─────────────────────────────────┘
```

**Result:**

- **Humans see** the bottom layer through the transparent DRM video
- **AI models see** the DRM layer and cannot read the content
- **Screenshots capture** the top layer when DRM video disappears

## Features

### 🛡️ **Core Protection**

- **AI Vision Blocking**: Prevents GPT-4V, Claude Vision, and other AI models from reading content
- **Screenshot Protection**: Blocks screenshot tools and screen capture
- **Hardware Acceleration Detection**: Comprehensive 5-layer detection system ensures DRM requirements
- **Tamper-Proof Security**: Prevents function override attacks and client-side manipulation
- **DRM Integration**: Uses browser EME APIs for hardware-level protection
- **Cross-Browser**: Works on Chrome, Firefox, Safari, Edge

### 🔧 **Developer Experience**

- **Zero Configuration**: Works out of the box with intelligent auto-detection
- **TypeScript Support**: Full type definitions with Valibot schema validation
- **Multiple Formats**: ESM, CommonJS, UMD builds available
- **Lightweight**: < 80KB minified, tree-shakeable
- **Smart Configuration**: Environment variable auto-detection across all frameworks
- **Helpful Errors**: Detailed validation messages with actionable suggestions
- **Provider Registry**: Extensible system for community-contributed DRM providers

### 🎯 **Multi-DRM Provider Architecture**

- **Provider-Agnostic Design**: Support for any DRM provider through extensible registry system
- **Built-in Providers**: PallyCon/DoveRunner with full token generation support
- **Smart Auto-Detection**: Automatic provider selection based on browser capabilities
- **Configuration Management**: Valibot-powered validation with environment variable auto-detection
- **Multi-DRM Support**: Widevine, PlayReady, FairPlay across all providers
- **Health Monitoring**: Real-time provider status and performance tracking

## Examples

### Basic Text Protection

```javascript
const cloakscreen = new Cloakscreen({
  containerId: 'secret-content',
});

await cloakscreen.protect(`
    API Key: sk-1234567890abcdef
    Database Password: MySecretPassword123!
    Credit Card: 4532-1234-5678-9012
`);
```

### React Component Protection

```tsx
import React, { useRef, useEffect } from 'react';
import { protect } from 'cloakscreen';

function ProtectedContent() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeCloakscreen = async () => {
      if (!contentRef.current) return;

      try {
        await protect(contentRef.current, {
          provider: {
            name: import.meta.env.VITE_DRM_PROVIDER,
            siteId: import.meta.env.VITE_DRM_SITE_ID,
            tokenEndpoint: import.meta.env.VITE_DRM_TOKEN_ENDPOINT,
          },
        });
      } catch (error) {
        console.error('Failed to protect content:', error);
      }
    };

    initializeCloakscreen();
  }, []);

  return (
    <div ref={contentRef}>
      <h2>Protected Sensitive Information</h2>
      <p>API Key: sk-1234567890abcdef</p>
      <p>Database Password: MySecretPassword123!</p>
    </div>
  );
}
```

### Custom DRM Provider

```javascript
import { DRMProvider, providerRegistry } from 'cloakscreen';

// Create custom provider class
class MyCustomProvider extends DRMProvider {
  static getMetadata() {
    return {
      name: 'mycustom',
      displayName: 'My Custom DRM',
      description: 'Custom DRM provider implementation',
      supportedKeySystems: ['com.widevine.alpha'],
      requiredConfig: ['licenseServer', 'apiKey'],
      optionalConfig: ['debug'],
    };
  }

  async initialize() {
    // Your DRM setup logic
  }

  async getLicenseToken(contentId) {
    return await fetch('/api/my-drm-token', {
      method: 'POST',
      body: JSON.stringify({ contentId, apiKey: this.config.apiKey }),
    })
      .then(r => r.json())
      .then(data => data.token);
  }

  getLicenseServerUrl() {
    return this.config.licenseServer;
  }

  getContentUrl() {
    return '/path/to/drm/content.mpd';
  }

  // ... implement other required methods
}

// Register your custom provider
providerRegistry.register('mycustom', MyCustomProvider);

// Use your custom provider
const cloakscreen = new Cloakscreen({
  element: '#protected-content',
  provider: {
    name: 'mycustom',
    config: {
      licenseServer: 'https://my-license-server.com',
      apiKey: 'my-api-key',
    },
  },
});
```

## Configuration

### Basic Options

```javascript
const cloakscreen = new Cloakscreen({
  containerId: 'protected-content', // Required: DOM element ID

  // Optional configuration
  options: {
    contentType: 'text', // 'text', 'code', 'html'
    theme: 'default', // 'default', 'dark', 'light'
    autoStart: true, // Auto-start protection
    debugMode: false, // Enable debug logging

    // Layer configuration
    layers: {
      video: {
        width: 640,
        height: 360,
        loop: true,
        muted: true,
      },
    },

    // Protection settings
    protection: {
      blockScreenshots: true,
      blockAIVision: true,
      blockDevTools: false,
    },
  },
});
```

### Multi-Provider Configuration

```javascript
import { Cloakscreen, Providers, providerRegistry, configurationManager } from 'cloakscreen';

// 1. Auto-detection from environment variables
const cloakscreen = new Cloakscreen({
  element: '#content',
  // Provider auto-detected from DRM_* environment variables
});

// 2. Explicit provider configuration
const cloakscreen = new Cloakscreen({
  element: '#content',
  provider: {
    name: 'pallycon',
    config: {
      siteId: 'YOUR_SITE_ID',
      tokenEndpoint: '/api/get-license-token',
      licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
      debug: true,
    },
  },
});

// 3. Using provider factory with validation
const provider = Providers.PallyCon({
  siteId: 'YOUR_SITE_ID',
  tokenEndpoint: '/api/get-license-token',
});

// 4. Advanced: Provider registry operations
const availableProviders = providerRegistry.getAvailable();
const isSupported = await providerRegistry.isSupported('pallycon');
const metadata = providerRegistry.getMetadata('pallycon');

// 5. Configuration validation and templates
const validation = configurationManager.validateConfig('pallycon', config);
const template = configurationManager.getConfigTemplate('pallycon');
const autoConfig = configurationManager.autoDetectConfig('pallycon');
```

## API Reference

### Cloakscreen Class

#### Constructor

```typescript
new Cloakscreen(config: CloakscreenConfig)
```

**Enhanced Validation**: Cloakscreen uses [Valibot](https://valibot.dev) for runtime configuration validation, providing:

- **Detailed Error Messages** with specific field validation
- **Helpful Suggestions** for fixing configuration issues
- **Type Safety** with automatic TypeScript inference
- **Runtime Validation** that catches errors early

```typescript
// Example: Invalid configuration with helpful error
try {
  new Cloakscreen({
    element: '', // Invalid: empty selector
    provider: 'invalid', // Invalid: unsupported provider
  });
} catch (error) {
  console.log(error.message);
  // "Configuration validation failed: element: Element selector cannot be empty, provider: Only "pallycon" provider is supported as string shorthand"

  console.log(error.suggestions);
  // [
  //   "Provide a valid element: { element: "#my-element" } or { element: document.getElementById("my-element") }",
  //   "Use string shorthand: "pallycon" or full config: { name: "pallycon", config: {...} }"
  // ]
}
```

#### Methods

```typescript
// Protect content
await cloakscreen.protect(content: string): Promise<void>

// Remove protection
await cloakscreen.unprotect(): Promise<void>

// Update content
await cloakscreen.updateContent(newContent: string): Promise<void>

// Destroy instance
await cloakscreen.destroy(): Promise<void>

// Get status
cloakscreen.getStatus(): ProtectionStatus
```

#### Events

```typescript
cloakscreen.on('ready', () => console.log('Protection ready'));
cloakscreen.on('protected', () => console.log('Content protected'));
cloakscreen.on('error', error => console.error('Protection error:', error));
```

#### Configuration Validation

All configuration objects are validated at runtime using Zod schemas:

```typescript
// Valid configurations
const config1 = {
  element: '#content',
  provider: 'pallycon', // Simple string shorthand
};

const config2 = {
  element: document.getElementById('content'),
  provider: {
    name: 'pallycon',
    config: {
      siteId: 'YOUR_SITE_ID',
      tokenEndpoint: '/api/get-license-token',
    },
  },
  content: {
    readOnly: true,
    style: { color: 'blue' },
  },
  security: {
    fallbackMode: 'blur',
    debugMode: false,
  },
};

// Invalid configurations will throw ConfigurationError with helpful messages
```

### Provider System

#### Built-in Providers

```typescript
// PallyCon Provider
Providers.PallyCon({
  siteId: string,              // Required: PallyCon Site ID
  tokenEndpoint: string,       // Required: Token endpoint URL
  licenseServer?: string,      // Optional: Custom license server
  certificateUri?: string,     // Optional: Custom certificate URI
  headers?: Record<string, string>, // Optional: Custom headers
  debug?: boolean              // Optional: Enable debug logging
})

// Provider utilities
Providers.getAvailable()       // Get all available provider names
Providers.getMetadata(name)    // Get provider metadata
Providers.isSupported(name)    // Check if provider is supported
```

#### Provider Registry

```typescript
import { providerRegistry, DRMProvider } from 'cloakscreen';

// Register custom provider
providerRegistry.register('myProvider', MyProviderClass);

// Create provider instance
const provider = providerRegistry.create('pallycon', config);

// Check capabilities
const isSupported = await providerRegistry.isSupported('pallycon');
const metadata = providerRegistry.getMetadata('pallycon');
```

#### Configuration Management

```typescript
import { configurationManager } from 'cloakscreen';

// Validate configuration
const validation = configurationManager.validateConfig('pallycon', config);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
  console.warn('Suggestions:', validation.suggestions);
}

// Get configuration template
const template = configurationManager.getConfigTemplate('pallycon');

// Auto-detect from environment
const autoConfig = configurationManager.autoDetectConfig('pallycon');
```

## Credential Management

### 🔐 **Universal Environment Variable Support**

Cloakscreen automatically detects credentials from environment variables across **all frameworks**:

| Variable             | Description           | Example                                     |
| -------------------- | --------------------- | ------------------------------------------- |
| `DRM_PROVIDER`       | DRM provider name     | `DRM_PROVIDER=pallycon`                     |
| `DRM_SITE_ID`        | Provider site ID      | `DRM_SITE_ID=YOUR_SITE_ID`                  |
| `DRM_TOKEN_ENDPOINT` | Token endpoint URL    | `DRM_TOKEN_ENDPOINT=/api/get-license-token` |
| `DRM_LICENSE_SERVER` | Custom license server | `DRM_LICENSE_SERVER=https://my-license.com` |

**Provider-specific variables:**

```bash
# Provider-specific configuration
DRM_PROVIDER=pallycon
DRM_SITE_ID=YOUR_SITE_ID
DRM_TOKEN_ENDPOINT=/api/token
```

### 🌐 **Framework Compatibility**

Works seamlessly across all modern frameworks:

| Framework   | Environment Support     | Auto-Detection |
| ----------- | ----------------------- | -------------- |
| **Vite**    | `import.meta.env.DRM_*` | ✅ Automatic   |
| **Next.js** | `process.env.DRM_*`     | ✅ Automatic   |
| **Webpack** | `process.env.DRM_*`     | ✅ Automatic   |
| **Node.js** | `process.env.DRM_*`     | ✅ Automatic   |
| **Browser** | `window.env.DRM_*`      | ✅ Automatic   |

### 🔑 **Getting Credentials**

1. **PallyCon (Self-hosted)**: Sign up at [pallycon.com](https://pallycon.com) to get your Site ID
2. **Custom DRM Providers**: Use your existing DRM provider credentials

### 🛠️ **Configuration Examples**

```bash
# .env file (works with all frameworks)
DRM_PROVIDER=pallycon
DRM_SITE_ID=YOUR_SITE_ID
DRM_TOKEN_ENDPOINT=/api/get-license-token
```

```javascript
// Zero-config usage (auto-detects from environment)
import { protect } from 'cloakscreen';
await protect('#content'); // Automatically uses environment variables

// Manual override
await protect('#content', {
  provider: {
    name: 'pallycon',
    config: {
      siteId: 'OVERRIDE_SITE_ID',
      tokenEndpoint: '/custom/endpoint',
    },
  },
});
```

## Self-Hosting vs Cloud

### 🏠 **Self-Hosting (Free)**

Perfect for developers and small projects:

- ✅ **MIT Licensed** - Use freely in any project
- ✅ **Full Source Code** - Complete transparency
- ✅ **No Vendor Lock-in** - Host anywhere
- ✅ **Community Support** - GitHub issues and discussions

**Requirements:**

- Your own DRM provider (PallyCon, Axinom, EzDRM, etc.)
- HTTPS web server
- Basic DRM knowledge for setup

**Supported DRM Providers:**

- ✅ **PallyCon/DoveRunner** - Built-in support with full integration
- 🔄 **Axinom DRM-X** - Coming soon
- 🔄 **EzDRM** - Coming soon
- 🔄 **Verimatrix** - Coming soon
- ✅ **Custom Providers** - Extensible architecture for any DRM system

### ☁️ **Cloakscreen Cloud (Paid)**

Enterprise-ready managed service:

- 🚀 **Managed DRM Infrastructure** - No setup required
- 🛡️ **Enterprise Security** - SOC2, GDPR compliant
- 📞 **Professional Support** - SLA and dedicated support
- 📊 **Advanced Analytics** - Usage monitoring and insights
- 🔧 **Custom Integrations** - API and webhook support
- ⚡ **Global CDN** - Optimized worldwide delivery

**Perfect for:**

- Production applications
- Enterprise customers
- Teams needing support
- Compliance requirements

[**Get Started with Cloakscreen Cloud →**](https://cloud.cloakscreen.tech)

## DRM Video Generation & Encryption

### 🎬 **Complete DRM Content Pipeline**

Cloakscreen now includes a complete system for generating and encrypting the blank videos needed for the three-layer protection:

```bash
# Quick Start: Generate source video and DRM content
export KMS_TOKEN="your_kms_token_here"
npm run generate-drm

# Generate source video only (720p, 35 seconds)
npm run generate-video

# Generate specific DRM formats
npm run generate-drm-dash    # DASH only (Widevine/PlayReady)
npm run generate-drm-hls     # HLS only (FairPlay)
npm run generate-drm-cmaf    # CMAF (all DRM types)

# Custom video generation
node tools/generate-drm-video.js --width 1920 --height 1080 --duration 60

# Validate encrypted content
npm run drm:validate ./drm-content/stream.mpd
```

### 🔧 **Programmatic API**

```typescript
import { DRMWorkflow, VideoGenerator } from 'cloakscreen';

// Complete workflow: video generation → encryption → manifest → validation
const workflow = new DRMWorkflow('pallycon', {
  siteId: 'YOUR_SITE_ID',
  tokenEndpoint: '/api/get-license-token',
});

const result = await workflow.execute({
  provider: 'pallycon',
  videoOptions: {
    width: 100,
    height: 100,
    color: 'white',
    duration: 1,
    fps: 1,
    format: 'mp4',
  },
  outputDir: './drm-content',
});

// Quick generation with defaults
const result = await DRMWorkflow.quickGenerate('pallycon', './output');

// Generate source video programmatically
import { VideoGenerator } from 'cloakscreen/node';

const videoGenerator = new VideoGenerator();
const videoPath = await videoGenerator.generate({
  width: 1280,
  height: 720,
  color: 'blue',
  duration: 35,
  fps: 30,
  output: 'public/dash_assets/source.mp4'
);
```

### 📋 **DRM Provider Support**

| Provider                | Status             | Encryption Tool | Manifest Types |
| ----------------------- | ------------------ | --------------- | -------------- |
| **PallyCon/DoveRunner** | ✅ Full Support    | DoveRunner CLI  | DASH           |
| **Axinom DRM-X**        | 🔄 Coming Soon     | Axinom API      | DASH, HLS      |
| **EzDRM**               | 🔄 Coming Soon     | EzDRM API       | DASH, HLS      |
| **Custom Providers**    | ✅ Framework Ready | Extensible      | Any            |

### 🛠️ **Setup Requirements**

#### For PallyCon/DoveRunner:

1. **FFmpeg** (for video generation)

   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   apt-get install ffmpeg

   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

2. **DoveRunner CLI** (for DRM encryption)
   - Sign up at [PallyCon Console](https://console.pallycon.com)
   - Download and install DoveRunner CLI
   - Configure with your PallyCon credentials
   - Ensure `doverunner` command is in PATH

3. **Verify Setup**
   ```bash
   npm run drm:check --provider=pallycon
   ```

## Multi-Provider Architecture

### 🏗️ **Extensible Provider System**

Cloakscreen's architecture makes it easy to support any DRM provider:

```typescript
# 1. Built-in providers work out of the box
import { Providers } from 'cloakscreen';
const provider = Providers.PallyCon({ siteId: 'YOUR_SITE_ID', tokenEndpoint: '/api/token' });

// 2. Register custom providers
import { providerRegistry, DRMProvider } from 'cloakscreen';

class MyDRMProvider extends DRMProvider {
  static getMetadata() {
    return {
      name: 'mydrmservice',
      displayName: 'My DRM Service',
      supportedKeySystems: ['com.widevine.alpha'],
      requiredConfig: ['apiKey', 'licenseServer'],
    };
  }
  // ... implement required methods
}

providerRegistry.register('mydrmservice', MyDRMProvider);

// 3. Use intelligent provider selection
import { ProviderFactory } from 'cloakscreen';
const bestProvider = await ProviderFactory.createBestProvider(
  ['mydrmservice', 'pallycon'], // preference order
  { mydrmservice: { apiKey: 'key' }, pallycon: { siteId: 'YOUR_SITE_ID' } }
);
```

### 🔍 **Provider Discovery & Health Monitoring**

```typescript
// Check what providers are available
const available = providerRegistry.getAvailable();
console.log('Available providers:', available);

// Check browser compatibility
const supported = await ProviderFactory.getEnvironmentSupport();
console.log('Supported in this browser:', supported.supportedProviders);

# Monitor provider health
const provider = Providers.PallyCon({ siteId: 'YOUR_SITE_ID', tokenEndpoint: '/api/token' });
const health = await provider.getHealthStatus();
console.log('Provider health:', health.status); // 'healthy' | 'degraded' | 'unhealthy'
```

### 🎯 **Smart Configuration Management**

```typescript
import { configurationManager } from 'cloakscreen';

// Validate configuration with helpful errors
const validation = configurationManager.validateConfig('pallycon', {
  siteId: '', // Invalid: empty
  tokenEndpoint: 'invalid-url', // Invalid: not a URL
});

if (!validation.valid) {
  console.log('Errors:', validation.errors);
  // ["siteId: Site ID is required", "tokenEndpoint: Must be a valid URL"]

  console.log('Suggestions:', validation.suggestions);
  // ["Add siteId to your configuration", "Use a valid URL format"]
}

// Get configuration template
const template = configurationManager.getConfigTemplate('pallycon');
console.log('Template:', template);
// { siteId: '<siteId>', tokenEndpoint: '<tokenEndpoint>', ... }
```

## Browser Support

| Browser     | DRM Support | Status          |
| ----------- | ----------- | --------------- |
| Chrome 60+  | Widevine    | ✅ Full Support |
| Firefox 60+ | Widevine    | ✅ Full Support |
| Safari 14+  | FairPlay    | ✅ Full Support |
| Edge 80+    | PlayReady   | ✅ Full Support |

**Requirements:**

- HTTPS environment (required for DRM)
- Modern browser with EME support
- DRM provider account (for self-hosting)

## Security Considerations

### 🛡️ **Hardware Acceleration Detection**

Cloakscreen includes comprehensive hardware acceleration detection to ensure DRM security requirements:

```typescript
import { detectHardwareAcceleration } from 'cloakscreen';

const status = await detectHardwareAcceleration();
console.log('Hardware acceleration available:', status.available);
console.log('GPU detected:', status.gpu?.renderer);
// Example: "ANGLE (ARM, Mali-G715, OpenGL ES 3.2)"
```

**Detection Methods:**

- ✅ **WebGL Hardware Acceleration** - Detects GPU vs software rendering
- ✅ **WebGL2 Support** - Modern GPU feature detection
- ✅ **DRM Robustness** - Hardware-backed DRM (Widevine L1) detection
- ✅ **Video Decoding** - Hardware video acceleration detection
- ✅ **Canvas 2D Acceleration** - 2D graphics acceleration detection

**Supported GPUs:**

- ✅ **NVIDIA GeForce** (RTX 4090, GTX 1080, etc.)
- ✅ **AMD Radeon** (RX 7900 XTX, etc.)
- ✅ **Intel Graphics** (Iris Xe, UHD, etc.)
- ✅ **ARM Mali** (Mali-G715, Mali-G78, etc.)
- ✅ **Apple Silicon** (M1, M2, M3 GPUs)
- ✅ **Qualcomm Adreno** (mobile GPUs)

### 🔒 **Tamper-Proof Security**

Prevents client-side bypass attempts through multiple security layers:

```typescript
// Automatic tamper detection
const cloak = new Cloakscreen({
  element: '#content',
  provider: 'pallycon',
});

try {
  await cloak.protect();
} catch (error) {
  if (error instanceof HardwareAccelerationError) {
    // Hardware acceleration not available - content hard blocked
    console.error('Security violation:', error.suggestions);
  }
}
```

**Security Features:**

- ✅ **Function Signature Verification** - Detects overridden browser APIs
- ✅ **Runtime Behavior Analysis** - Identifies suspicious function behavior
- ✅ **Performance Timing Validation** - Prevents fake acceleration timing
- ✅ **Hard Content Blocking** - No fallback when security is compromised

### What Cloakscreen Protects Against

- ✅ **AI Vision Models** (GPT-4V, Claude Vision, etc.)
- ✅ **Screenshot Tools** (built-in and third-party)
- ✅ **Screen Recording** (when DRM is active)
- ✅ **Automated Content Extraction**
- ✅ **Copy/Paste Attacks**
- ✅ **Function Override Attacks** (client-side tampering)
- ✅ **Fake GPU Spoofing** (software rendering bypass attempts)
- ✅ **Performance Manipulation** (timing attack prevention)

### What It Cannot Protect Against

- ❌ **Determined Manual Transcription** (humans typing what they see)
- ❌ **Physical Photography** (camera pointed at screen)
- ❌ **Browser Developer Tools** (when enabled)
- ❌ **Compromised Client Devices**
- ❌ **Server-Side Attacks** (protect your token endpoints)

### Best Practices

- Always use HTTPS (required for DRM)
- Implement proper authentication
- Monitor for suspicious activity
- Use short-lived DRM tokens
- Enable hardware acceleration in browser settings
- Keep graphics drivers updated
- Test on target devices before deployment
- Combine with other security measures

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/cloakscreen/cloakscreen.git
cd cloakscreen

# Install dependencies
npm install
# Or use Bun for faster installs (3-5x faster)
bun install

# Start development server
npm run dev

# Run tests
npm test
# Or use Bun for faster testing
bun test

# Build for production
npm run build

# Format code (auto-runs on save in VS Code)
npm run format

# Lint and fix issues
npm run lint:fix

# Generate API documentation
npm run docs:generate
```

#### Enhanced Developer Experience

This project includes modern DX tools for a smooth development experience:

- **🎨 Prettier**: Automatic code formatting on save
- **🔧 ESLint**: Code quality and consistency checks
- **🪝 Husky + lint-staged**: Pre-commit hooks that auto-format and lint
- **⚡ Bun Support**: 3-5x faster package management and testing
- **🛠️ Universal Editor Support**: Works with any modern editor
- **📦 Changesets**: Automated versioning and changelog generation
- **📚 TypeDoc**: Auto-generated API documentation from TypeScript comments

**Editor Integration**: Most modern editors support Prettier and ESLint out of the box. Configure your editor to format on save for the best experience.

## License

**MIT License** - See [LICENSE](LICENSE) file for details.

This project is open source and free to use. We also offer [Cloakscreen Cloud](https://cloud.cloakscreen.tech) - a managed service with additional features and support.

## Support

### Community Support (Free)

- 📖 [Documentation](https://docs.cloakscreen.tech)
- 💬 [GitHub Discussions](https://github.com/cloakscreen/cloakscreen/discussions)
- 🐛 [Issue Tracker](https://github.com/cloakscreen/cloakscreen/issues)

### Professional Support (Paid)

- 📞 **Priority Support** - SLA-backed response times
- 🔧 **Custom Integration** - Tailored implementation help
- 📊 **Training & Consulting** - Expert guidance
- 🛡️ **Security Audits** - Professional security review

[**Get Professional Support →**](https://cloud.cloakscreen.tech/support)

---

**Made with ❤️ by the Cloakscreen Team**

_Protecting content in the age of AI_
