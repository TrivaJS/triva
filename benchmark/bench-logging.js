import { performance } from 'perf_hooks';
import { build, log } from '../lib/index.js';

class BenchmarkRunner {
  constructor() {
    this.results = [];
  }

  async run(name, fn, iterations = 10000) {
    for (let i = 0; i < 100; i++) await fn();
    if (global.gc) global.gc();

    const times = [];
    const startMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      times.push(performance.now() - start);
    }

    const endMemory = process.memoryUsage().heapUsed;

    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    const result = {
      name,
      iterations,
      min: times[0].toFixed(4) + 'ms',
      max: times[times.length - 1].toFixed(4) + 'ms',
      avg: avg.toFixed(4) + 'ms',
      p50: times[Math.floor(times.length * 0.5)].toFixed(4) + 'ms',
      p95: times[Math.floor(times.length * 0.95)].toFixed(4) + 'ms',
      p99: times[Math.floor(times.length * 0.99)].toFixed(4) + 'ms',
      opsPerSec: Math.floor(1000 / avg).toLocaleString() + ' ops/sec',
      memoryDelta: ((endMemory - startMemory) / 1024 / 1024 > 0 ? '+' : '') + ((endMemory - startMemory) / 1024 / 1024).toFixed(2) + 'MB'
    };

    this.results.push(result);
    this.printResult(result);
    return result;
  }

  printResult(r) {
    console.log(`📊 ${r.name}`);
    console.log(`   Iterations: ${r.iterations.toLocaleString()}`);
    console.log(`   Avg: ${r.avg} | P50: ${r.p50} | P95: ${r.p95} | P99: ${r.p99}`);
    console.log(`   Min: ${r.min} | Max: ${r.max}`);
    console.log(`   Throughput: ${r.opsPerSec}`);
    console.log(`   Memory: ${r.memoryDelta}
`);
  }

  printSummary() {
        console.log(`\n${'='.repeat(70)}\n📈 Benchmark Summary\n`);
        this.results.forEach(r => console.log(`${r.name.padEnd(40)} ${r.avg.padStart(12)} ${r.opsPerSec.padStart(15)}`));
        console.log(`\n${'='.repeat(70)}\n`);
      }
    }

/**
 * Logging Performance Benchmark
 * Tests request logging speed
 */


async function benchmarkLogging() {
  console.log('📊 Logging Benchmarks\n');

  const runner = new BenchmarkRunner();

  await build({
    cache: { type: 'memory' },
    retention: {
      enabled: true,
      maxEntries: 100000
    }
  });

  // Benchmark: Create log entry (simple)
  const simpleLogResult = await runner.run(
    'Create Log Entry (simple)',
    async () => {
      const entry = {
        timestamp: Date.now(),
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        ip: '192.168.1.1'
      };
    },
    50000
  );
  runner.printResult(simpleLogResult);

  // Benchmark: Create log entry (detailed)
  const detailedLogResult = await runner.run(
    'Create Log Entry (detailed)',
    async () => {
      const entry = {
        timestamp: Date.now(),
        method: 'POST',
        path: '/api/users',
        statusCode: 201,
        responseTime: 45.23,
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        cookies: { session: 'abc123', theme: 'dark' },
        query: { page: '1', limit: '10' },
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json'
        }
      };
    },
    50000
  );
  runner.printResult(detailedLogResult);

  // Benchmark: Timestamp formatting
  const timestampResult = await runner.run(
    'Timestamp Formatting',
    async () => {
      const timestamp = new Date().toISOString();
    },
    100000
  );
  runner.printResult(timestampResult);

  // Benchmark: Response time calculation
  const responseTimeResult = await runner.run(
    'Response Time Calculation',
    async () => {
      const start = Date.now();
      // Simulate some work
      await Promise.resolve();
      const end = Date.now();
      const responseTime = end - start;
    },
    50000
  );
  runner.printResult(responseTimeResult);

  // Benchmark: Cookie sanitization
  const cookieSanitizeResult = await runner.run(
    'Cookie Sanitization',
    async () => {
      const cookies = {
        session: 'abc123',
        auth_token: 'secret_token_here',
        theme: 'dark',
        lang: 'en'
      };

      const sanitized = { ...cookies };
      delete sanitized.auth_token;
      delete sanitized.session;
    },
    100000
  );
  runner.printResult(cookieSanitizeResult);

  // Benchmark: Header sanitization
  const headerSanitizeResult = await runner.run(
    'Header Sanitization',
    async () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer token',
        'cookie': 'session=abc',
        'user-agent': 'Mozilla/5.0'
      };

      const sanitized = { ...headers };
      delete sanitized.authorization;
      delete sanitized.cookie;
    },
    100000
  );
  runner.printResult(headerSanitizeResult);

  // Benchmark: Log entry serialization
  const serializeResult = await runner.run(
    'Log Entry Serialization',
    async () => {
      const entry = {
        timestamp: Date.now(),
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        responseTime: 45.23,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const serialized = JSON.stringify(entry);
    },
    50000
  );
  runner.printResult(serializeResult);

  // Benchmark: Log filtering
  const filterResult = await runner.run(
    'Log Filtering',
    async () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        method: 'GET',
        statusCode: i % 2 === 0 ? 200 : 404
      }));

      const filtered = logs.filter(log => log.statusCode === 404);
    },
    10000
  );
  runner.printResult(filterResult);

  // Benchmark: Export formatting
  const exportResult = await runner.run(
    'Export Formatting',
    async () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        method: 'GET',
        path: `/api/test${i}`,
        statusCode: 200
      }));

      const exported = JSON.stringify(logs, null, 2);
    },
    1000
  );
  runner.printResult(exportResult);

  runner.printSummary();
}

benchmarkLogging().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
