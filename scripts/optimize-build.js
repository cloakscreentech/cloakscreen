#!/usr/bin/env node
/**
 * Build optimization utilities
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync, brotliCompressSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * Optimize bundle for production
 */
export function optimizeBundle(filePath) {
  console.log(`🔧 Optimizing ${filePath}...`);

  const content = readFileSync(filePath, 'utf8');
  let optimized = content;

  // Remove development-only code
  optimized = optimized.replace(
    /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)\s*{[^}]*}/g,
    ''
  );

  // Remove debug statements
  optimized = optimized.replace(/console\.debug\([^)]*\);?/g, '');

  // Remove excessive whitespace (but preserve necessary spacing)
  optimized = optimized.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Write optimized version
  writeFileSync(filePath, optimized);

  // Calculate compression ratios
  const originalSize = Buffer.byteLength(content, 'utf8');
  const optimizedSize = Buffer.byteLength(optimized, 'utf8');
  const gzipSize = gzipSync(optimized).length;
  const brotliSize = brotliCompressSync(optimized).length;

  console.log(`  Original: ${formatSize(originalSize)}`);
  console.log(
    `  Optimized: ${formatSize(optimizedSize)} (${(((originalSize - optimizedSize) / originalSize) * 100).toFixed(1)}% reduction)`
  );
  console.log(`  Gzipped: ${formatSize(gzipSize)}`);
  console.log(`  Brotli: ${formatSize(brotliSize)}`);

  return {
    original: originalSize,
    optimized: optimizedSize,
    gzipped: gzipSize,
    brotli: brotliSize,
  };
}

/**
 * Format file size
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generate bundle report
 */
export function generateBundleReport() {
  const distDir = join(rootDir, 'dist');
  const bundles = ['index.esm.js', 'index.js', 'cloakscreen.min.js', 'node.esm.js', 'node.js'];

  console.log('\n📦 Bundle Report:');
  console.log('─'.repeat(80));
  console.log(
    'Bundle'.padEnd(20) +
      'Size'.padEnd(12) +
      'Gzipped'.padEnd(12) +
      'Brotli'.padEnd(12) +
      'Compression'
  );
  console.log('─'.repeat(80));

  const report = {};

  for (const bundle of bundles) {
    try {
      const filePath = join(distDir, bundle);
      const content = readFileSync(filePath);
      const size = content.length;
      const gzipped = gzipSync(content).length;
      const brotli = brotliCompressSync(content).length;
      const compression = (((size - gzipped) / size) * 100).toFixed(1);

      report[bundle] = { size, gzipped, brotli, compression };

      console.log(
        bundle.padEnd(20) +
          formatSize(size).padEnd(12) +
          formatSize(gzipped).padEnd(12) +
          formatSize(brotli).padEnd(12) +
          `${compression}%`
      );
    } catch (error) {
      console.warn(`⚠️  Could not analyze ${bundle}: ${error.message}`);
    }
  }

  // Optionally save report (only if BUILD_SAVE_REPORT env var is set)
  if (process.env.BUILD_SAVE_REPORT === 'true') {
    const reportPath = join(rootDir, 'bundle-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBundleReport();
}
