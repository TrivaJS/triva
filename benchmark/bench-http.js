
import { performance } from 'perf_hooks';
import { build, get, post, listen } from '../lib/index.js';
import http from 'http';

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
 * HTTP Server Performance Benchmark
 * Tests end-to-end HTTP request handling
 */


async function benchmarkHTTP() {
  console.log('🌐 HTTP Server Benchmarks\n');

  const runner = new BenchmarkRunner();
  const port = 9998;
  let server;

  await build({
    cache: { type: 'memory' },
    throttle: { limit: 100000, window_ms: 60000 }
  });

  // Setup routes
  get('/bench/simple', (req, res) => {
    res.json({ ok: true });
  });

  get('/bench/data', (req, res) => {
    res.json({
      id: 123,
      name: 'Test',
      data: { nested: true },
      timestamp: Date.now()
    });
  });

  post('/bench/echo', async (req, res) => {
    const body = await req.json();
    res.json(body);
  });

  server = listen(port);

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 200));

  // Benchmark: Simple GET request
  const simpleGetResult = await runner.run(
    'HTTP GET (simple response)',
    async () => {
      await makeRequest('GET', '/bench/simple');
    },
    1000
  );
  runner.printResult(simpleGetResult);

  // Benchmark: GET with JSON response
  const jsonGetResult = await runner.run(
    'HTTP GET (JSON response)',
    async () => {
      await makeRequest('GET', '/bench/data');
    },
    1000
  );
  runner.printResult(jsonGetResult);

  // Benchmark: POST with JSON body
  const postResult = await runner.run(
    'HTTP POST (JSON body)',
    async () => {
      await makeRequest('POST', '/bench/echo', JSON.stringify({
        name: 'test',
        value: 123
      }));
    },
    1000
  );
  runner.printResult(postResult);

  // Benchmark: Concurrent requests
  const concurrentResult = await runner.run(
    'HTTP Concurrent (10 requests)',
    async () => {
      await Promise.all(
        Array.from({ length: 10 }, () =>
          makeRequest('GET', '/bench/simple')
        )
      );
    },
    100
  );
  runner.printResult(concurrentResult);

  // Cleanup
  if (server) server.close();

  runner.printSummary();

  // Helper function
  function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {}
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }
}

benchmarkHTTP().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
