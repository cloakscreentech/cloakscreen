const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-setup.ts',
    // Focus on core functionality
    '!src/drm/**/*', // Skip DRM generation tools (Node.js specific)
    '!src/types/**/*', // Skip type definitions
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds (realistic for OSS)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Higher standards for core modules
    './src/core/': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/hardware-acceleration.ts': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
