import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import dts from 'rollup-plugin-dts';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// External dependencies that should not be bundled
const external = ['shaka-player'];

// Production build flag
const isProduction =
  process.env.NODE_ENV === 'production' || process.env.BUILD_MODE === 'production';

// Common plugins configuration
const getPlugins = (browser = true, declaration = false, minify = false) => {
  const plugins = [
    resolve({
      browser,
      preferBuiltins: !browser,
      // Optimize Zod imports
      exportConditions: browser ? ['browser', 'module', 'import'] : ['node', 'module', 'import'],
    }),
    commonjs({
      // Optimize CommonJS conversion
      transformMixedEsModules: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration,
      declarationDir: declaration ? 'dist' : undefined,
      // Optimize TypeScript compilation
      compilerOptions: {
        removeComments: true,
        importHelpers: true,
      },
    }),
  ];

  // Add minification for production builds
  if (minify || isProduction) {
    plugins.push(
      terser({
        compress: {
          drop_console: false, // Keep console for debugging
          drop_debugger: true,
          pure_funcs: ['console.debug'], // Remove debug logs
          passes: 2, // Multiple passes for better compression
        },
        mangle: {
          // Preserve function names for better debugging
          keep_fnames: /^(protect|Cloakscreen|createProvider)$/,
        },
        format: {
          comments: false, // Remove all comments
        },
      })
    );
  }

  return plugins;
};

// Build configurations - Optimized from 9 to 5 targets
const configs = [];

// 1. ES Module build (modern browsers) - with tree-shaking optimization
configs.push({
  input: 'src/index.ts',
  output: {
    file: pkg.module,
    format: 'es',
    sourcemap: true,
  },
  external,
  plugins: getPlugins(true, false),
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
});

// 2. CommonJS build (Node.js compatibility) - with tree-shaking optimization
configs.push({
  input: 'src/index.ts',
  output: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
  },
  external,
  plugins: getPlugins(true, false),
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
});

// 3. UMD build for CDN usage (browser global) - with minification and tree-shaking
configs.push({
  input: 'src/index.ts',
  output: {
    file: 'dist/cloakscreen.min.js',
    format: 'umd',
    name: 'Cloakscreen',
    sourcemap: true,
    exports: 'named',
    globals: {
      'shaka-player': 'shaka',
    },
  },
  external,
  plugins: [
    ...getPlugins(true, false, true), // Enable minification for UMD
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
});

// 4. Node.js CommonJS build (includes DRM tools) - consolidated Node.js target
configs.push({
  input: 'src/node.ts',
  output: {
    file: 'dist/node.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
  },
  external,
  plugins: getPlugins(false, false),
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
});

// 5. Consolidated Type definitions - single .d.ts build
configs.push({
  input: 'src/index.ts',
  output: {
    file: pkg.types,
    format: 'es',
  },
  external,
  plugins: [dts()],
});

// Note: Removed redundant builds to optimize build time:
// - Removed separate Node.js ES Module build (CJS covers Node.js needs)
// - Removed separate type definitions for errors/types (consolidated into main .d.ts)
// - Maintained all core functionality while reducing build complexity

export default configs;
