/**
 * Cache Performance Benchmark
 * Tests cache operations across all adapters
 */

import { performance } from 'perf_hooks';
import { build, cache } from '../lib/index.js';

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
    this.printResult(result);
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
}

async function runCacheBenchmarks() {
  console.log('🗄️  Cache Benchmarks\n');

  const runner = new BenchmarkRunner();

  // Initialize with memory cache
  await build({
    cache: { type: 'memory', retention: 3600000 }
  });

  // Benchmark: Set operation
  let counter = 0;
  await runner.run(
    'Cache Set (small string)',
    async () => {
      await cache.set(`bench:set:${counter++}`, 'test value');
    },
    10000
  );

  // Benchmark: Get operation (existing key)
  await cache.set('bench:get:persistent', 'test value');
  await runner.run(
    'Cache Get (existing key)',
    async () => {
      await cache.get('bench:get:persistent');
    },
    10000
  );

  // Benchmark: Get operation (non-existent key)
  await runner.run(
    'Cache Get (miss)',
    async () => {
      await cache.get('bench:nonexistent:' + Math.random());
    },
    10000
  );

  // Benchmark: Set with object
  counter = 0;
  await runner.run(
    'Cache Set (object)',
    async () => {
      await cache.set(`bench:obj:${counter++}`, {
        id: counter,
        name: 'test',
        data: { nested: true }
      });
    },
    10000
  );

  // Benchmark: Set with TTL
  counter = 0;
  await runner.run(
    'Cache Set (with TTL)',
    async () => {
      await cache.set(`bench:ttl:${counter++}`, 'value', 60000);
    },
    10000
  );

  // Benchmark: Delete operation
  counter = 0;
  await runner.run(
    'Cache Delete',
    async () => {
      const key = `bench:del:${counter}`;
      await cache.set(key, 'value');
      await cache.delete(key);
      counter++;
    },
    5000
  );

  // Benchmark: Pattern delete
  await runner.run(
    'Cache Delete Pattern',
    async () => {
      const prefix = `bench:pattern:${Date.now()}`;
      await cache.set(`${prefix}:1`, 'v1');
      await cache.set(`${prefix}:2`, 'v2');
      await cache.set(`${prefix}:3`, 'v3');
      await cache.delete(`${prefix}:*`);
    },
    1000
  );

  // Benchmark: Large object
  const largeObject = {
    items: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      data: 'x'.repeat(100)
    }))
  };
  counter = 0;
  await runner.run(
    'Cache Set (large object)',
    async () => {
      await cache.set(`bench:large:${counter++}`, largeObject);
    },
    1000
  );

  // Benchmark: Concurrent operations
  await runner.run(
    'Cache Concurrent (10 ops)',
    async () => {
      await Promise.all([
        cache.set('bench:c1', 'v1'),
        cache.set('bench:c2', 'v2'),
        cache.get('bench:c1'),
        cache.set('bench:c3', 'v3'),
        cache.get('bench:c2'),
        cache.set('bench:c4', 'v4'),
        cache.get('bench:c3'),
        cache.set('bench:c5', 'v5'),
        cache.get('bench:c4'),
        cache.get('bench:c5')
      ]);
    },
    1000
  );

  runner.printSummary();
}

runCacheBenchmarks().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
