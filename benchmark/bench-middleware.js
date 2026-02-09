
import { performance } from 'perf_hooks';
import { build, use } from '../lib/index.js';

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
 * Middleware Performance Benchmark
 * Tests middleware processing speed
 */


async function benchmarkMiddleware() {
  console.log('🔌 Middleware Benchmarks\n');

  const runner = new BenchmarkRunner();

  await build({
    cache: { type: 'memory' }
  });

  // Benchmark: Single middleware
  const middleware1 = (req, res, next) => {
    req.custom = 'value';
    next();
  };

  const singleMiddlewareResult = await runner.run(
    'Single Middleware Execution',
    async () => {
      const mockReq = {};
      const mockRes = {};
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };

      middleware1(mockReq, mockRes, mockNext);
    },
    100000
  );
  runner.printResult(singleMiddlewareResult);

  // Benchmark: Middleware chain (3 middlewares)
  const middlewares = [
    (req, res, next) => { req.step1 = true; next(); },
    (req, res, next) => { req.step2 = true; next(); },
    (req, res, next) => { req.step3 = true; next(); }
  ];

  const chainResult = await runner.run(
    'Middleware Chain (3)',
    async () => {
      const mockReq = {};
      const mockRes = {};

      let index = 0;
      const runNext = () => {
        if (index < middlewares.length) {
          const mw = middlewares[index++];
          mw(mockReq, mockRes, runNext);
        }
      };

      runNext();
    },
    50000
  );
  runner.printResult(chainResult);

  // Benchmark: Middleware chain (10 middlewares)
  const longChain = Array.from({ length: 10 }, (_, i) =>
    (req, res, next) => {
      req[`step${i}`] = true;
      next();
    }
  );

  const longChainResult = await runner.run(
    'Middleware Chain (10)',
    async () => {
      const mockReq = {};
      const mockRes = {};

      let index = 0;
      const runNext = () => {
        if (index < longChain.length) {
          const mw = longChain[index++];
          mw(mockReq, mockRes, runNext);
        }
      };

      runNext();
    },
    20000
  );
  runner.printResult(longChainResult);

  // Benchmark: Async middleware
  const asyncMiddleware = async (req, res, next) => {
    await Promise.resolve();
    req.async = true;
    next();
  };

  const asyncResult = await runner.run(
    'Async Middleware',
    async () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = () => {};

      await asyncMiddleware(mockReq, mockRes, mockNext);
    },
    10000
  );
  runner.printResult(asyncResult);

  // Benchmark: Error handling middleware
  const errorMiddleware = (err, req, res, next) => {
    res.error = err.message;
    next();
  };

  const errorResult = await runner.run(
    'Error Handling Middleware',
    async () => {
      const mockErr = new Error('Test error');
      const mockReq = {};
      const mockRes = {};
      const mockNext = () => {};

      errorMiddleware(mockErr, mockReq, mockRes, mockNext);
    },
    50000
  );
  runner.printResult(errorResult);

  // Benchmark: Cookie parser middleware simulation
  const cookieParserResult = await runner.run(
    'Cookie Parser Middleware',
    async () => {
      const cookieHeader = 'session=abc123; user=john; theme=dark';
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
    },
    50000
  );
  runner.printResult(cookieParserResult);

  // Benchmark: Body parser simulation (small JSON)
  const bodyParserResult = await runner.run(
    'Body Parser (small JSON)',
    async () => {
      const body = '{"name":"test","value":123}';
      const parsed = JSON.parse(body);
    },
    50000
  );
  runner.printResult(bodyParserResult);

  // Benchmark: Body parser (large JSON)
  const largeBody = JSON.stringify({
    items: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }))
  });

  const largeBodyResult = await runner.run(
    'Body Parser (large JSON)',
    async () => {
      const parsed = JSON.parse(largeBody);
    },
    10000
  );
  runner.printResult(largeBodyResult);

  runner.printSummary();
}

benchmarkMiddleware().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
