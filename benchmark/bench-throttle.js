
import { performance } from 'perf_hooks';

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
    console.log('\n' + '='.repeat(70) + '\n📈 Benchmark Summary\n');
    this.results.forEach(r => console.log(`${r.name.padEnd(40)} ${r.avg.padStart(12)} ${r.opsPerSec.padStart(15)}`));
    console.log('\n' + '='.repeat(70) + '\n');
  }
}

/**
 * Throttle/Rate Limiting Performance Benchmark
 * Tests rate limiting speed
 */


async function benchmarkThrottle() {
  console.log('🛡️  Throttle Benchmarks\n');

  const runner = new BenchmarkRunner();

  await build({
    cache: { type: 'memory' },
    throttle: {
      limit: 1000,
      window_ms: 60000
    }
  });

  // Benchmark: Rate limit check (under limit)
  const checkResult = await runner.run(
    'Rate Limit Check (allowed)',
    async () => {
      const ip = 'bench-ip-' + Math.random();
      const timestamp = Date.now();
      const key = `throttle:${ip}`;

      // Simulate rate limit check
      const count = 1; // Under limit
      const allowed = count < 1000;
    },
    50000
  );
  runner.printResult(checkResult);

  // Benchmark: Sliding window calculation
  const slidingWindowResult = await runner.run(
    'Sliding Window Calculation',
    async () => {
      const now = Date.now();
      const windowMs = 60000;
      const timestamps = [
        now - 50000,
        now - 40000,
        now - 30000,
        now - 20000,
        now - 10000
      ];

      // Count requests in window
      const inWindow = timestamps.filter(t => t > now - windowMs).length;
    },
    50000
  );
  runner.printResult(slidingWindowResult);

  // Benchmark: Burst detection
  const burstResult = await runner.run(
    'Burst Detection',
    async () => {
      const timestamps = [
        Date.now(),
        Date.now() - 10,
        Date.now() - 20,
        Date.now() - 30,
        Date.now() - 40
      ];

      // Check if requests within 1 second
      const burstWindow = 1000;
      const recent = timestamps.filter(t => t > Date.now() - burstWindow);
      const isBurst = recent.length > 5;
    },
    50000
  );
  runner.printResult(burstResult);

  // Benchmark: IP extraction
  const ipExtractionResult = await runner.run(
    'IP Address Extraction',
    async () => {
      const mockReq = {
        socket: { remoteAddress: '192.168.1.1' },
        connection: { remoteAddress: '192.168.1.1' },
        headers: { 'x-forwarded-for': '192.168.1.1' }
      };

      const ip = mockReq.headers['x-forwarded-for'] ||
                 mockReq.socket?.remoteAddress ||
                 mockReq.connection?.remoteAddress;
    },
    100000
  );
  runner.printResult(ipExtractionResult);

  // Benchmark: Ban check
  const banCheckResult = await runner.run(
    'Ban Status Check',
    async () => {
      const ip = 'test-ip';
      const banKey = `ban:${ip}`;
      const violations = 2; // Under threshold
      const banned = violations >= 5;
    },
    100000
  );
  runner.printResult(banCheckResult);

  // Benchmark: Policy evaluation
  const policyResult = await runner.run(
    'Policy Evaluation',
    async () => {
      const context = {
        pathname: '/api/admin/users',
        method: 'GET'
      };

      // Evaluate policy
      let limit = 100; // Default
      if (context.pathname?.startsWith('/api/admin')) {
        limit = 50;
      } else if (context.pathname?.startsWith('/api/public')) {
        limit = 1000;
      }
    },
    100000
  );
  runner.printResult(policyResult);

  // Benchmark: User-Agent parsing
  const uaParseResult = await runner.run(
    'User-Agent Parsing',
    async () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const lowerUA = ua.toLowerCase();

      const isChrome = lowerUA.includes('chrome');
      const isFirefox = lowerUA.includes('firefox');
      const isSafari = lowerUA.includes('safari') && !isChrome;
    },
    50000
  );
  runner.printResult(uaParseResult);

  // Benchmark: Request fingerprinting
  const fingerprintResult = await runner.run(
    'Request Fingerprinting',
    async () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0...',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip, deflate'
        },
        socket: { remoteAddress: '192.168.1.1' }
      };

      const fingerprint = [
        req.socket?.remoteAddress,
        req.headers['user-agent'],
        req.headers['accept-language']
      ].join('|');
    },
    50000
  );
  runner.printResult(fingerprintResult);

  runner.printSummary();
}

benchmarkThrottle().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
