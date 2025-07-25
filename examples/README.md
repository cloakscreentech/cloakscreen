# Cloakscreen Examples

This directory contains various examples demonstrating how to use Cloakscreen for content protection with different frameworks and approaches.

## 📁 Available Examples

### Vanilla JavaScript Examples

- **`basic-protection.html`** - Basic content protection with DRM integration
- **`basic-code-protection.html`** - Code snippet protection example
- **`cdn-usage.html`** - Using Cloakscreen via CDN
- **`simple-usage.html`** - Simple implementation example
- **`zero-config.html`** - Zero-configuration setup

### React Examples

- **`react-protection.html`** - Complete React demo with per-character background protection
- **`react-component-example.jsx`** - React components and hooks for Cloakscreen integration

## 🎨 Per-Character Background Protection

The React examples showcase the new **per-character background protection** feature that ensures:

- ✅ Each character gets its own background color
- ✅ Multicolor text is properly protected
- ✅ No more long black rows that don't work with varied text colors
- ✅ Proper whitespace handling

### Before vs After

**Before (Per-Row):**

```
[████████████████████████] ← Long black row
This is red and blue text
```

**After (Per-Character):**

```
[T][h][i][s] [i][s] [r][e][d] [a][n][d] [b][l][u][e] [t][e][x][t]
 ↑   ↑   ↑    ↑   ↑   ↑ red ↑   ↑   ↑  blue ↑   ↑   ↑   ↑   ↑
```

## 🚀 Running the Examples

### React Examples

#### Option 1: Direct HTML (react-protection.html)

```bash
# Start the development server
npm run dev

# Open in browser
open http://localhost:3000/examples/react-protection.html
```

#### Option 2: React Component (react-component-example.jsx)

```bash
# Install React dependencies in your project
npm install react react-dom

# Import and use the components
import { ProtectedContent, useContentProtection } from './examples/react-component-example.jsx';
```

### Vanilla JavaScript Examples

```bash
# Start the development server
npm run dev

# Open any HTML example in browser
open http://localhost:3000/examples/basic-protection.html
```

## 🔧 React Integration Guide

### Using the Custom Hook

```jsx
import { useContentProtection } from './examples/react-component-example.jsx';

function MyComponent() {
  const { contentRef, isProtected, protect, unprotect } = useContentProtection({
    provider: {
      name: 'pallycon',
      siteId: 'your-site-id',
      tokenEndpoint: '/api/token',
    },
    enablePerCharacterBackgrounds: true,
  });

  return (
    <div>
      <div ref={contentRef}>
        <span style={{ color: 'red' }}>Red text</span> and{' '}
        <span style={{ color: 'blue' }}>blue text</span>
      </div>
      <button onClick={protect}>Protect</button>
      <button onClick={unprotect}>Unprotect</button>
    </div>
  );
}
```

### Using the ProtectedContent Component

```jsx
import { ProtectedContent } from './examples/react-component-example.jsx';

function App() {
  return (
    <ProtectedContent
      options={{
        provider: { name: 'pallycon', siteId: 'your-site-id' },
        enablePerCharacterBackgrounds: true,
      }}
      autoProtect={true}
    >
      <h1>Protected Content</h1>
      <p>
        This <span style={{ color: 'red' }}>multicolor text</span> will be protected with
        per-character backgrounds.
      </p>
    </ProtectedContent>
  );
}
```

## 🎯 Key Features Demonstrated

### Per-Character Background Protection

- Individual character background colors
- Proper multicolor text support
- Whitespace preservation
- Enhanced security through granular protection

### React Integration

- Custom hooks for easy integration
- Reusable components
- Auto-protection options
- Error handling and loading states
- Protection history tracking

### DRM Integration

- PallyCon provider support
- Token-based authentication
- Encrypted media handling
- Hardware acceleration detection

## 🛠️ Configuration Options

```javascript
const options = {
  // DRM Provider Configuration
  provider: {
    name: 'pallycon', // DRM provider name
    siteId: 'your-site-id', // Your site ID
    tokenEndpoint: '/api/token', // Token endpoint URL
  },

  // Protection Features
  enablePerCharacterBackgrounds: true, // Enable per-character backgrounds
  debug: false, // Enable debug logging

  // Advanced Options
  tamperDetection: true, // Enable tamper detection
  hardwareAcceleration: 'auto', // Hardware acceleration preference
  layerCount: 3, // Number of protection layers
};
```

## 📚 Additional Resources

- [Main Documentation](../README.md)
- [API Reference](../docs/)
- [Setup Guide](../docs/SETUP.md)
- [Build Formats](../docs/BUILD_FORMATS.md)

## 🤝 Contributing

Found an issue with the examples or want to add a new one? Please see our [Contributing Guide](../CONTRIBUTING.md).
