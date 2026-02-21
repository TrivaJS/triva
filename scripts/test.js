#!/usr/bin/env node

/**
 * Test Runner Script (Zero Dependencies)
 * Runs all tests using only Node.js built-in modules
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

console.log('🧪 Triva Test Suite (Zero Dependencies)\n');

async function runTests(type = 'all') {
  const testDirs = {
    unit:        resolve(rootDir, 'test/unit'),
    integration: resolve(rootDir, 'test/integration'),
    adapters:    resolve(rootDir, 'test/adapters')
  };

  const types = type === 'all' ? ['unit', 'integration', 'adapters'] : [type];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const testType of types) {
    const testDir = testDirs[testType];

    console.log(`\n📋 Running ${testType} tests...\n`);

    try {
      const files = await readdir(testDir);
      const testFiles = files.filter(f => f.endsWith('.test.js')).sort();

      if (testFiles.length === 0) {
        console.log(`  ⚠️  No test files found in ${testType}/`);
        continue;
      }

      for (const file of testFiles) {
        const testPath = resolve(testDir, file);
        const result = await runTestFile(testPath);

        if (result.code !== 0) {
          totalFailed++;
        } else {
          totalPassed++;
        }
      }
    } catch (err) {
      console.error(`❌ Error reading ${testType} directory:`, err.message);
      totalFailed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Total: ${totalPassed + totalFailed} test suites`);
  console.log(`   ✅ Passed: ${totalPassed}`);
  console.log(`   ❌ Failed: ${totalFailed}\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

function runTestFile(filepath) {
  return new Promise((resolve) => {
    const child = spawn('node', [filepath], {
      cwd: rootDir,
      stdio: 'inherit'
    });

    child.on('close', (code) => resolve({ code }));
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';

// Validate test type
if (!['all', 'unit', 'integration', 'adapters'].includes(testType)) {
  console.error(`❌ Invalid test type: ${testType}`);
  console.log('Usage: node scripts/test.js [all|unit|integration|adapters]');
  process.exit(1);
}

// Run tests
runTests(testType).catch((err) => {
  console.error('❌ Test runner error:', err);
  process.exit(1);
});
