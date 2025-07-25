#!/usr/bin/env node

/**
 * Bundle Size Analyzer - Detailed breakdown of what's in our bundles
 */

import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

function analyzeBundle(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const gzipped = gzipSync(content);

    console.log(`\n📦 ${filePath}:`);
    console.log(`   Raw size: ${(content.length / 1024).toFixed(1)}KB`);
    console.log(`   Gzipped:  ${(gzipped.length / 1024).toFixed(1)}KB`);
    console.log(`   Compression: ${((1 - gzipped.length / content.length) * 100).toFixed(1)}%`);

    // Analyze content patterns
    const patterns = {
      'Zod imports': (content.match(/zod|ZodSchema|z\./g) || []).length,
      'Type definitions': (content.match(/interface|type\s+\w+/g) || []).length,
      'Function definitions': (content.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length,
      'Import statements': (content.match(/import\s+.*from|require\(/g) || []).length,
      'String literals': (content.match(/"[^"]*"|'[^']*'/g) || []).length,
      Comments: (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length,
    };

    console.log('   Content breakdown:');
    Object.entries(patterns).forEach(([name, count]) => {
      console.log(`     ${name}: ${count} occurrences`);
    });

    // Check for large dependencies
    const zodMatches = content.match(/zod[\s\S]{0,1000}/g) || [];
    if (zodMatches.length > 0) {
      console.log(`   🔍 Zod usage detected: ${zodMatches.length} instances`);
    }

    return {
      raw: content.length,
      gzipped: gzipped.length,
      patterns,
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${filePath}:`, error.message);
    return null;
  }
}

console.log('🔍 Analyzing bundle composition...\n');

const bundles = ['dist/index.esm.js', 'dist/index.js', 'dist/cloakscreen.min.js', 'dist/node.js'];

const results = {};
bundles.forEach(bundle => {
  results[bundle] = analyzeBundle(bundle);
});

console.log('\n📊 Summary:');
console.log('─'.repeat(60));

const totalRaw = Object.values(results)
  .filter(Boolean)
  .reduce((sum, r) => sum + r.raw, 0);
const totalGzipped = Object.values(results)
  .filter(Boolean)
  .reduce((sum, r) => sum + r.gzipped, 0);

console.log(
  `Total bundle size (all formats): ${(totalRaw / 1024).toFixed(1)}KB raw, ${(totalGzipped / 1024).toFixed(1)}KB gzipped`
);

// Identify largest contributors
const largest = Object.entries(results)
  .filter(([_, result]) => result)
  .sort(([_, a], [__, b]) => b.raw - a.raw)[0];

if (largest) {
  console.log(`\n🎯 Largest bundle: ${largest[0]} (${(largest[1].raw / 1024).toFixed(1)}KB)`);
}
