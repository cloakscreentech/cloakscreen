# Cloakscreen Build Formats

This document explains when to use each build format of Cloakscreen.

## Available Builds

### 1. ES Module (`dist/index.esm.js`)

- **Format**: ES2020 modules
- **Use case**: Modern bundlers (Webpack, Vite, Rollup)
- **Import**: `import { Cloakscreen } from 'cloakscreen'`
- **Tree-shaking**: ✅ Supported
- **Size**: ~68KB

### 2. CommonJS (`dist/index.js`)

- **Format**: CommonJS modules
- **Use case**: Node.js, older bundlers
- **Import**: `const { Cloakscreen } = require('cloakscreen')`
- **Tree-shaking**: ❌ Not supported
- **Size**: ~68KB

### 3. UMD/CDN (`dist/cloakscreen.min.js`)

- **Format**: Universal Module Definition
- **Use case**: Direct browser usage, CDN
- **Import**: `<script src="..."></script>` → `window.Cloakscreen`
- **Tree-shaking**: ❌ Not supported
- **Size**: ~80KB

### 4. TypeScript Definitions (`dist/index.d.ts`)

- **Format**: TypeScript declaration files
- **Use case**: TypeScript projects
- **Size**: ~20KB

## Usage Examples

### Modern Bundlers (Recommended)

```javascript
import { Cloakscreen, protect } from 'cloakscreen';

// Use the library
await protect('#content', { provider: 'demo' });
```

### Node.js / CommonJS

```javascript
const { Cloakscreen, protect } = require('cloakscreen');

// Use the library
await protect('#content', { provider: 'demo' });
```

### CDN / Direct Browser Usage

```html
<script src="https://cdn.jsdelivr.net/npm/cloakscreen@latest/dist/cloakscreen.min.js"></script>
<script>
  // Use the global Cloakscreen object
  Cloakscreen.protect('#content', { provider: 'demo' });
</script>
```

## Build Optimization

### Removed Redundant Builds

- ❌ **Removed**: Separate UMD build (`index.umd.js`) - redundant with CDN build
- ❌ **Removed**: IIFE build - UMD serves the same purpose
- ✅ **Kept**: Essential builds only (ESM, CJS, UMD/CDN, Types)

### Bundle Size Reduction

- **Before**: 5 builds, ~400KB total
- **After**: 4 builds, ~320KB total
- **Savings**: 20% reduction in build artifacts

## Recommendations

### For Library Authors

- Use **ES Module** build for best tree-shaking
- Import only what you need: `import { protect } from 'cloakscreen'`

### For Applications

- **Modern apps**: Use ES Module build
- **Legacy apps**: Use CommonJS build
- **No bundler**: Use UMD/CDN build

### For CDN Usage

- **jsDelivr**: `https://cdn.jsdelivr.net/npm/cloakscreen@latest/dist/cloakscreen.min.js`
- **unpkg**: `https://unpkg.com/cloakscreen@latest/dist/cloakscreen.min.js`

## Performance Notes

- **ES Module**: Best for production (tree-shaking reduces final bundle size)
- **CommonJS**: Good compatibility, but includes entire library
- **UMD/CDN**: Largest size, but works everywhere without build step

---

_Choose the build format that best matches your project's needs and tooling._
