/**
 * Build configuration and optimization settings
 */

export const buildConfig = {
  // Build targets
  targets: {
    browser: {
      formats: ['es', 'umd'],
      minify: true,
      sourcemap: true,
    },
    node: {
      formats: ['es', 'cjs'],
      minify: false,
      sourcemap: true,
    },
  },

  // Bundle optimization
  optimization: {
    treeshaking: true,
    minifyIdentifiers: true,
    removeComments: true,
    compressWhitespace: true,
  },

  // External dependencies
  externals: {
    // Peer dependencies
    'shaka-player': 'shaka',

    // Node.js built-ins (for Node.js builds)
    fs: 'fs',
    path: 'path',
    crypto: 'crypto',
    stream: 'stream',
  },

  // Output configuration
  output: {
    preserveModules: false,
    interop: 'auto',
    exports: 'named',
    generatedCode: 'es2015',
  },

  // TypeScript configuration
  typescript: {
    target: 'ES2020',
    module: 'ESNext',
    strict: true,
    declaration: true,
    sourceMap: true,
  },

  // Performance budgets
  performance: {
    maxBundleSize: '500kb', // Main bundle
    maxChunkSize: '250kb', // Individual chunks
    maxAssetSize: '100kb', // Assets
  },

  // Build analysis
  analysis: {
    bundleAnalyzer: false,
    sizeReport: true,
    compressionReport: true,
  },
};
