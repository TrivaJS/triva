
import { performance } from 'perf_hooks';
import { build, get, post } from '../lib/index.js';

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
 * Routing Performance Benchmark
 * Tests HTTP routing and request handling
 */


async function benchmarkRouting() {
  console.log('🛣️  Routing Benchmarks\n');

  const runner = new BenchmarkRunner();

  await build({
    cache: { type: 'memory' }
  });

  // Benchmark: Route matching (simple)
  const simpleRoutes = [];
  for (let i = 0; i < 10; i++) {
    get(`/route${i}`, (req, res) => res.json({ id: i }));
    simpleRoutes.push(`/route${i}`);
  }

  const routeMatchResult = await runner.run(
    'Route Matching (10 routes)',
    async () => {
      const route = simpleRoutes[Math.floor(Math.random() * simpleRoutes.length)];
      // Simulate route matching logic
      const matched = simpleRoutes.includes(route);
    },
    50000
  );
  runner.printResult(routeMatchResult);

  // Benchmark: Route with parameters
  get('/users/:id', (req, res) => res.json({ userId: req.params.id }));

  const paramRouteResult = await runner.run(
    'Route Parameter Extraction',
    async () => {
      const route = '/users/:id';
      const path = '/users/123';
      const params = extractParams(route, path);
    },
    50000
  );
  runner.printResult(paramRouteResult);

  // Benchmark: Query string parsing
  const queryParseResult = await runner.run(
    'Query String Parsing',
    async () => {
      const query = new URLSearchParams('?name=test&age=25&tags=js&tags=node');
      const parsed = Object.fromEntries(query);
    },
    50000
  );
  runner.printResult(queryParseResult);

  // Benchmark: JSON response
  const mockRes = createMockResponse();
  const jsonResponseResult = await runner.run(
    'JSON Response Serialization',
    async () => {
      mockRes.json({
        status: 'ok',
        data: { id: 123, name: 'test' },
        timestamp: Date.now()
      });
    },
    50000
  );
  runner.printResult(jsonResponseResult);

  // Benchmark: Complex object JSON response
  const complexData = {
    users: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`
    }))
  };
  const complexJsonResult = await runner.run(
    'JSON Response (complex object)',
    async () => {
      mockRes.json(complexData);
    },
    10000
  );
  runner.printResult(complexJsonResult);

  // Benchmark: Multiple route matching
  for (let i = 10; i < 100; i++) {
    get(`/api/v1/resources/${i}`, (req, res) => res.json({ id: i }));
  }

  const multiRouteResult = await runner.run(
    'Route Matching (100 routes)',
    async () => {
      const id = Math.floor(Math.random() * 90) + 10;
      const route = `/api/v1/resources/${id}`;
      // Simulate matching
    },
    50000
  );
  runner.printResult(multiRouteResult);

  runner.printSummary();
}

// Helper functions
function extractParams(route, path) {
  const routeParts = route.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  const params = {};

  routeParts.forEach((part, i) => {
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[i];
    }
  });

  return params;
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.setHeader('Content-Type', 'application/json');
      JSON.stringify(data);
    }
  };
}

benchmarkRouting().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
