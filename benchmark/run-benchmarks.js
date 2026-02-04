#!/usr/bin/env node

/**
 * Triva Benchmark Suite
 * Comprehensive performance testing for all framework features
 */

import { performance } from 'perf_hooks';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpus, totalmem, platform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('⚡ Triva Benchmark Suite\n');
console.log('Platform:', platform());
console.log('Node:', process.version);
console.log('CPUs:', cpus().length);
console.log('Memory:', Math.round(totalmem() / 1024 / 1024 / 1024) + 'GB');
console.log('\n' + '='.repeat(70) + '\n');

class BenchmarkRunner {
  constructor() {
    this.results = [];
  }

  async run(name, fn, iterations = 10000) {
    // Warmup
    for (let i = 0; i < 100; i++) {
      await fn();
    }

    // Clear garbage
    if (global.gc) global.gc();

    // Actual benchmark
    const times = [];
    const startMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const endMemory = process.memoryUsage().heapUsed;

    // Calculate statistics
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    const opsPerSec = Math.floor(1000 / avg);
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024;

    const result = {
      name,
      iterations,
      min: min.toFixed(4) + 'ms',
      max: max.toFixed(4) + 'ms',
      avg: avg.toFixed(4) + 'ms',
      p50: p50.toFixed(4) + 'ms',
      p95: p95.toFixed(4) + 'ms',
      p99: p99.toFixed(4) + 'ms',
      opsPerSec: opsPerSec.toLocaleString() + ' ops/sec',
      memoryDelta: (memoryDelta > 0 ? '+' : '') + memoryDelta.toFixed(2) + 'MB'
    };

    this.results.push(result);
    return result;
  }

  printResult(result) {
    console.log(`📊 ${result.name}`);
    console.log(`   Iterations: ${result.iterations.toLocaleString()}`);
    console.log(`   Avg: ${result.avg} | P50: ${result.p50} | P95: ${result.p95} | P99: ${result.p99}`);
    console.log(`   Min: ${result.min} | Max: ${result.max}`);
    console.log(`   Throughput: ${result.opsPerSec}`);
    console.log(`   Memory: ${result.memoryDelta}`);
    console.log('');
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('\n📈 Benchmark Summary\n');
    
    this.results.forEach(r => {
      console.log(`${r.name.padEnd(40)} ${r.avg.padStart(12)} ${r.opsPerSec.padStart(15)}`);
    });
    
    console.log('\n' + '='.repeat(70) + '\n');
  }

  exportResults(format = 'json') {
    if (format === 'json') {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        platform: process.platform,
        node: process.version,
        results: this.results
      }, null, 2);
    }
  }
}

async function main() {
  const benchmarkDir = __dirname;
  const files = await readdir(benchmarkDir);
  const benchmarkFiles = files
    .filter(f => f.startsWith('bench-') && f.endsWith('.js'))
    .sort();

  if (benchmarkFiles.length === 0) {
    console.log('No benchmark files found!\n');
    return;
  }

  console.log(`Found ${benchmarkFiles.length} benchmark suites\n`);

  for (const file of benchmarkFiles) {
    const benchmarkPath = join(benchmarkDir, file);
    console.log(`\n🏃 Running ${file}...\n`);
    
    try {
      const module = await import(benchmarkPath);
      if (module.default) {
        await module.default();
      }
    } catch (err) {
      console.error(`❌ Error running ${file}:`, err.message);
    }
  }

  console.log('\n✅ All benchmarks complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}

export { BenchmarkRunner };
