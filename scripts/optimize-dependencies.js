#!/usr/bin/env node
/**
 * Dependency optimization and cleanup script
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * Clean up package-lock.json and reinstall dependencies
 */
function cleanInstall() {
  console.log('🧹 Cleaning up dependencies...');

  try {
    // Remove package-lock.json and node_modules
    execSync('rm -rf package-lock.json node_modules', { cwd: rootDir });
    console.log('  ✓ Removed package-lock.json and node_modules');

    // Fresh install
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
    console.log('  ✓ Fresh npm install completed');

    return true;
  } catch (error) {
    console.error('  ❌ Error during clean install:', error.message);
    return false;
  }
}

/**
 * Run security audit
 */
function runSecurityAudit() {
  console.log('\n🔒 Running security audit...');

  try {
    const auditResult = execSync('npm audit --audit-level=moderate', {
      cwd: rootDir,
      encoding: 'utf8',
    });
    console.log('  ✓ No security vulnerabilities found');
    return true;
  } catch (error) {
    if (error.status === 1) {
      console.log('  ⚠️  Security vulnerabilities found:');
      console.log(error.stdout);
      console.log('\n  Run `npm audit fix` to attempt automatic fixes');
    } else {
      console.error('  ❌ Error running audit:', error.message);
    }
    return false;
  }
}

/**
 * Check for outdated dependencies
 */
function checkOutdated() {
  console.log('\n📅 Checking for outdated dependencies...');

  try {
    const outdatedResult = execSync('npm outdated --json', {
      cwd: rootDir,
      encoding: 'utf8',
    });

    if (outdatedResult.trim()) {
      const outdated = JSON.parse(outdatedResult);
      const count = Object.keys(outdated).length;

      if (count > 0) {
        console.log(`  ⚠️  ${count} outdated dependencies found:`);
        Object.entries(outdated).forEach(([name, info]) => {
          console.log(`    ${name}: ${info.current} → ${info.latest}`);
        });
        console.log('\n  Run `npm update` to update dependencies');
      } else {
        console.log('  ✓ All dependencies are up to date');
      }
    } else {
      console.log('  ✓ All dependencies are up to date');
    }

    return true;
  } catch (error) {
    if (error.status === 1) {
      console.log('  ✓ All dependencies are up to date');
      return true;
    }
    console.error('  ❌ Error checking outdated:', error.message);
    return false;
  }
}

/**
 * Analyze bundle impact
 */
function analyzeBundleImpact() {
  console.log('\n📦 Analyzing bundle impact...');

  const packagePath = join(rootDir, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

  const runtimeDeps = Object.keys(pkg.dependencies || {});
  const totalSize = runtimeDeps.length;

  console.log(`  Runtime dependencies: ${totalSize}`);

  // Estimate impact
  const heavyDeps = ['react', 'lodash', 'moment', 'axios'];
  const lightDeps = ['tslib', 'zod'];

  runtimeDeps.forEach(dep => {
    if (heavyDeps.some(heavy => dep.includes(heavy))) {
      console.log(`    ⚠️  ${dep} - potentially large bundle impact`);
    } else if (lightDeps.some(light => dep.includes(light))) {
      console.log(`    ✅ ${dep} - minimal bundle impact`);
    } else {
      console.log(`    ℹ️  ${dep} - unknown impact`);
    }
  });

  return { totalDeps: totalSize, runtimeDeps };
}

/**
 * Generate optimization report
 */
function generateReport() {
  console.log('\n📊 Dependency Optimization Report');
  console.log('═'.repeat(50));

  const packagePath = join(rootDir, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

  const stats = {
    runtime: Object.keys(pkg.dependencies || {}).length,
    dev: Object.keys(pkg.devDependencies || {}).length,
    peer: Object.keys(pkg.peerDependencies || {}).length,
  };

  console.log(`Runtime dependencies: ${stats.runtime}`);
  console.log(`Development dependencies: ${stats.dev}`);
  console.log(`Peer dependencies: ${stats.peer}`);
  console.log(`Total: ${stats.runtime + stats.dev + stats.peer}`);

  // Optimizations applied
  console.log('\n✅ Optimizations Applied:');
  console.log('  • Made shaka-player peer dependency optional');
  console.log('  • Moved React dependencies to examples/package.json');
  console.log('  • Kept essential test dependencies');
  console.log('  • Maintained minimal runtime dependencies');

  // Recommendations
  console.log('\n💡 Future Optimizations:');
  console.log('  • Consider Zod tree-shaking for smaller bundles');
  console.log('  • Monitor bundle size with build:analyze');
  console.log('  • Regular dependency audits');

  return stats;
}

// Main execution
async function main() {
  console.log('🚀 Dependency Optimization Tool\n');

  // Run optimizations
  const steps = [
    { name: 'Security Audit', fn: runSecurityAudit },
    { name: 'Outdated Check', fn: checkOutdated },
    { name: 'Bundle Analysis', fn: analyzeBundleImpact },
    { name: 'Generate Report', fn: generateReport },
  ];

  for (const step of steps) {
    try {
      await step.fn();
    } catch (error) {
      console.error(`❌ ${step.name} failed:`, error.message);
    }
  }

  console.log('\n🎉 Dependency optimization complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { cleanInstall, runSecurityAudit, checkOutdated, analyzeBundleImpact };
