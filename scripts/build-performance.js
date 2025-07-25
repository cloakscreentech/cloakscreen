#!/usr/bin/env node
/**
 * Build performance monitoring and optimization script
 */

import { performance } from 'perf_hooks';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * Performance metrics tracking
 */
class BuildPerformanceTracker {
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      buildSteps: [],
      bundleSizes: {},
      compressionRatios: {},
      warnings: [],
      errors: [],
    };
  }

  /**
   * Start tracking a build step
   */
  startStep(name) {
    const step = {
      name,
      startTime: performance.now(),
      endTime: null,
      duration: null,
    };
    this.metrics.buildSteps.push(step);
    return step;
  }

  /**
   * End tracking a build step
   */
  endStep(step) {
    step.endTime = performance.now();
    step.duration = step.endTime - step.startTime;
    console.log(`✓ ${step.name} completed in ${step.duration.toFixed(2)}ms`);
  }

  /**
   * Analyze bundle sizes
   */
  analyzeBundleSizes() {
    const distDir = join(rootDir, 'dist');
    const files = ['index.esm.js', 'index.js', 'cloakscreen.min.js', 'node.esm.js', 'node.js'];

    console.log('\n📊 Bundle Size Analysis:');
    console.log('─'.repeat(60));

    for (const file of files) {
      try {
        const filePath = join(distDir, file);
        const stats = statSync(filePath);
        const content = readFileSync(filePath);
        const gzipped = gzipSync(content);

        const size = stats.size;
        const gzipSize = gzipped.length;
        const compressionRatio = (((size - gzipSize) / size) * 100).toFixed(1);

        this.metrics.bundleSizes[file] = {
          raw: size,
          gzipped: gzipSize,
          compressionRatio: parseFloat(compressionRatio),
        };

        console.log(
          `${file.padEnd(20)} ${this.formatSize(size).padEnd(10)} ${this.formatSize(gzipSize).padEnd(10)} ${compressionRatio}%`
        );

        // Check against performance budgets
        this.checkPerformanceBudget(file, size, gzipSize);
      } catch (error) {
        console.warn(`⚠️  Could not analyze ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Check performance budgets
   */
  checkPerformanceBudget(filename, rawSize, gzipSize) {
    const budgets = {
      'cloakscreen.min.js': { raw: 500 * 1024, gzipped: 150 * 1024 }, // Main UMD bundle
      'index.esm.js': { raw: 400 * 1024, gzipped: 120 * 1024 }, // ES module
      'index.js': { raw: 400 * 1024, gzipped: 120 * 1024 }, // CommonJS
      'node.esm.js': { raw: 600 * 1024, gzipped: 180 * 1024 }, // Node ES module
      'node.js': { raw: 600 * 1024, gzipped: 180 * 1024 }, // Node CommonJS
    };

    const budget = budgets[filename];
    if (!budget) return;

    if (rawSize > budget.raw) {
      this.metrics.warnings.push(
        `⚠️  ${filename} exceeds raw size budget: ${this.formatSize(rawSize)} > ${this.formatSize(budget.raw)}`
      );
    }

    if (gzipSize > budget.gzipped) {
      this.metrics.warnings.push(
        `⚠️  ${filename} exceeds gzipped size budget: ${this.formatSize(gzipSize)} > ${this.formatSize(budget.gzipped)}`
      );
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const totalTime = performance.now() - this.metrics.startTime;

    console.log('\n🎯 Build Performance Report:');
    console.log('─'.repeat(60));
    console.log(`Total build time: ${totalTime.toFixed(2)}ms`);

    console.log('\nBuild steps:');
    for (const step of this.metrics.buildSteps) {
      if (step.duration) {
        console.log(`  ${step.name}: ${step.duration.toFixed(2)}ms`);
      }
    }

    if (this.metrics.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of this.metrics.warnings) {
        console.log(`  ${warning}`);
      }
    }

    if (this.metrics.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.metrics.errors) {
        console.log(`  ${error}`);
      }
    }

    // Optionally save metrics to file (only if BUILD_SAVE_REPORT env var is set)
    if (process.env.BUILD_SAVE_REPORT === 'true') {
      const reportPath = join(rootDir, 'build-performance.json');
      writeFileSync(reportPath, JSON.stringify(this.metrics, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    return this.metrics;
  }

  /**
   * Add warning
   */
  addWarning(message) {
    this.metrics.warnings.push(message);
  }

  /**
   * Add error
   */
  addError(message) {
    this.metrics.errors.push(message);
  }
}

/**
 * Main build performance analysis
 */
export function analyzeBuildPerformance() {
  const tracker = new BuildPerformanceTracker();

  console.log('🔍 Analyzing build performance...\n');

  // Analyze bundle sizes
  const sizeStep = tracker.startStep('Bundle size analysis');
  tracker.analyzeBundleSizes();
  tracker.endStep(sizeStep);

  // Generate final report
  return tracker.generateReport();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBuildPerformance();
}
