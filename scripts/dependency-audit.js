#!/usr/bin/env node
/**
 * Dependency audit and optimization script
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * Analyze package.json dependencies
 */
function analyzeDependencies() {
  const packagePath = join(rootDir, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

  console.log('🔍 Dependency Analysis Report\n');

  // Runtime dependencies
  console.log('📦 Runtime Dependencies:');
  console.log('─'.repeat(50));
  Object.entries(pkg.dependencies || {}).forEach(([name, version]) => {
    console.log(`  ${name.padEnd(20)} ${version}`);
  });

  // Peer dependencies
  console.log('\n🤝 Peer Dependencies:');
  console.log('─'.repeat(50));
  Object.entries(pkg.peerDependencies || {}).forEach(([name, version]) => {
    const meta = pkg.peerDependenciesMeta?.[name];
    const optional = meta?.optional ? ' (optional)' : ' (required)';
    console.log(`  ${name.padEnd(20)} ${version}${optional}`);
  });

  // Development dependencies
  console.log('\n🛠️  Development Dependencies:');
  console.log('─'.repeat(50));
  const devDeps = Object.entries(pkg.devDependencies || {});

  // Categorize dev dependencies
  const categories = {
    build: ['rollup', '@rollup/', 'typescript', 'tslib', 'vite'],
    testing: ['vitest', '@vitest/ui', '@vitest/coverage-v8', 'jsdom'],
    linting: ['eslint', 'prettier', 'lint-staged'],
    types: ['@types/'],
    tooling: ['husky', 'concurrently', 'tsx', 'typedoc'],
    changesets: ['@changesets/'],
    examples: ['react', '@vitejs/plugin-react'],
    server: ['express', 'cors', 'dotenv', 'commander'],
  };

  Object.entries(categories).forEach(([category, patterns]) => {
    console.log(`\n  ${category.toUpperCase()}:`);
    devDeps.forEach(([name, version]) => {
      if (patterns.some(pattern => name.includes(pattern))) {
        console.log(`    ${name.padEnd(30)} ${version}`);
      }
    });
  });

  // Uncategorized
  const categorized = new Set();
  Object.values(categories)
    .flat()
    .forEach(pattern => {
      devDeps.forEach(([name]) => {
        if (name.includes(pattern)) categorized.add(name);
      });
    });

  const uncategorized = devDeps.filter(([name]) => !categorized.has(name));
  if (uncategorized.length > 0) {
    console.log('\n  UNCATEGORIZED:');
    uncategorized.forEach(([name, version]) => {
      console.log(`    ${name.padEnd(30)} ${version}`);
    });
  }

  // Bundle size impact analysis
  console.log('\n📊 Bundle Impact Analysis:');
  console.log('─'.repeat(50));

  const runtimeDeps = Object.keys(pkg.dependencies || {});
  console.log(`Runtime dependencies that affect bundle size: ${runtimeDeps.length}`);
  runtimeDeps.forEach(dep => {
    console.log(`  • ${dep}`);
  });

  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('─'.repeat(50));

  // Check for unused dependencies
  if (runtimeDeps.includes('tslib')) {
    console.log('  ✅ tslib: Required for TypeScript compilation output');
  }

  if (runtimeDeps.includes('zod')) {
    console.log('  ✅ zod: Used for runtime validation - consider if all features are needed');
  }

  // Check peer dependencies
  const peerDeps = Object.keys(pkg.peerDependencies || {});
  if (peerDeps.includes('shaka-player')) {
    const isOptional = pkg.peerDependenciesMeta?.['shaka-player']?.optional;
    if (!isOptional) {
      console.log(
        '  ⚠️  shaka-player: Marked as required but used conditionally - should be optional'
      );
    }
  }

  return {
    runtime: Object.keys(pkg.dependencies || {}),
    peer: Object.keys(pkg.peerDependencies || {}),
    dev: Object.keys(pkg.devDependencies || {}),
    total:
      Object.keys(pkg.dependencies || {}).length +
      Object.keys(pkg.devDependencies || {}).length +
      Object.keys(pkg.peerDependencies || {}).length,
  };
}

/**
 * Check for security vulnerabilities
 */
async function checkSecurity() {
  console.log('\n🔒 Security Audit:');
  console.log('─'.repeat(50));
  console.log('Run `npm audit` for detailed security analysis');
}

/**
 * Generate dependency optimization plan
 */
function generateOptimizationPlan() {
  console.log('\n🎯 Optimization Plan:');
  console.log('─'.repeat(50));

  const plan = [
    {
      action: 'Fix peer dependency configuration',
      description: "Make shaka-player optional since it's used conditionally",
      priority: 'HIGH',
      impact: 'Reduces installation friction for users',
    },
    {
      action: 'Remove unused test dependencies',
      description: 'Remove vitest, @vitest/ui, @vitest/coverage-v8, jsdom if not used',
      priority: 'MEDIUM',
      impact: 'Reduces dev dependency count',
    },
    {
      action: 'Optimize Zod usage',
      description: 'Consider tree-shaking or alternative validation for smaller bundle',
      priority: 'LOW',
      impact: 'Potential bundle size reduction',
    },
    {
      action: 'Consolidate React dependencies',
      description: 'Move React deps to examples-specific package.json',
      priority: 'MEDIUM',
      impact: 'Cleaner main package dependencies',
    },
  ];

  plan.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.action} [${item.priority}]`);
    console.log(`   ${item.description}`);
    console.log(`   Impact: ${item.impact}`);
  });

  return plan;
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const stats = analyzeDependencies();
  checkSecurity();
  generateOptimizationPlan();

  console.log('\n📈 Summary:');
  console.log('─'.repeat(50));
  console.log(`Total dependencies: ${stats.total}`);
  console.log(
    `Runtime: ${stats.runtime.length}, Dev: ${stats.dev.length}, Peer: ${stats.peer.length}`
  );
}
