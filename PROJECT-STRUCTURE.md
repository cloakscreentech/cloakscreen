# 🚀 Clean Cloakscreen Project Structure

## Overview

Clean, minimal Vite setup with proper React support and TypeScript. No more messy Express JSX compilation!

## Project Structure

```
├── server.ts                           # Clean API server (port 3001)
├── vite.config.ts                      # Vite configuration with React
├── index.html                          # Main Vite entry point
├── main.tsx                            # React app with demo switcher
├── examples/
│   ├── basic-protection.html           # HTML example (UMD build)
│   └── basic-protection-react.tsx      # React example (ES modules)
├── src/                                # Library source code
└── dist/                               # Built library files
```

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Individual commands
npm run dev:server    # API server only (port 3001)
npm run dev:vite      # Vite dev server only (port 3000)

# Build library
npm run build
```

## Examples

### 📄 HTML Example (`examples/basic-protection.html`)

- Uses UMD build via CDN: `/cloakscreen.min.js`
- Global `window.Cloakscreen.protect()` API
- Simple, no build step required

### ⚛️ React Example (`examples/basic-protection-react.tsx`)

- Uses ES modules: `import('/index.esm.js')`
- Proper TypeScript support
- React hooks and modern patterns
- Hot reload during development

## Key Features

✅ **Clean separation**: API server vs frontend  
✅ **Proper React**: Native JSX/TSX compilation  
✅ **TypeScript**: Full type support  
✅ **Hot reload**: Instant updates during development  
✅ **Proxy setup**: API calls automatically routed  
✅ **Library serving**: Built files served correctly

## URLs

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **HTML Example**: http://localhost:3000/examples/basic-protection.html
- **React Example**: http://localhost:3000 → "View React Example"

## Benefits vs Old Express Setup

- 🚫 No more Babel compilation middleware
- 🚫 No more hacky JSX transformations
- 🚫 No more global window object dependencies
- ✅ Proper React DevTools support
- ✅ Fast HMR and optimized builds
- ✅ Clean ES module imports
- ✅ Better error handling and debugging
