# Triva Benchmarks

Comprehensive performance testing suite for all Triva framework features.

## Quick Start

```bash
# Run all benchmarks
npm run benchmark

# Run specific benchmark
npm run benchmark:cache
npm run benchmark:routing
npm run benchmark:middleware
npm run benchmark:throttle
npm run benchmark:logging
npm run benchmark:http
```

## Benchmark Suites

### 🗄️ Cache (`bench-cache.js`)
Tests cache operation performance across all adapters:
- Set operations (strings, objects, large data)
- Get operations (hits, misses)
- Delete operations (single, patterns)
- TTL expiration
- Concurrent operations

**Metrics:**
- Operations per second
- Average latency
- P50/P95/P99 percentiles
- Memory usage

### 🛣️ Routing (`bench-routing.js`)
Tests HTTP routing and request handling:
- Route matching (10, 100 routes)
- Parameter extraction
- Query string parsing
- JSON response serialization

**Metrics:**
- Route matching speed
- Parameter extraction speed
- Throughput (ops/sec)

### 🔌 Middleware (`bench-middleware.js`)
Tests middleware processing speed:
- Single middleware execution
- Middleware chains (3, 10 middlewares)
- Async middleware
- Error handling middleware
- Cookie/body parsing simulation

**Metrics:**
- Middleware execution time
- Chain processing overhead
- Async performance impact

### 🛡️ Throttle (`bench-throttle.js`)
Tests rate limiting performance:
- Rate limit checks
- Sliding window calculations
- Burst detection
- Policy evaluation
- IP extraction
- Request fingerprinting

**Metrics:**
- Check speed
- Policy evaluation overhead
- Fingerprint generation time

### 📊 Logging (`bench-logging.js`)
Tests request logging performance:
- Log entry creation (simple, detailed)
- Timestamp formatting
- Response time calculation
- Cookie/header sanitization
- Log serialization
- Filtering and export

**Metrics:**
- Entry creation speed
- Serialization overhead
- Filter performance

### 🌐 HTTP (`bench-http.js`)
Tests end-to-end HTTP performance:
- Simple GET requests
- JSON responses
- POST with body
- Concurrent requests

**Metrics:**
- Request/response latency
- Throughput
- Concurrent handling

## Understanding Results

### Output Format

```
📊 Cache Set (small string)
   Iterations: 10,000
   Avg: 0.0234ms | P50: 0.0210ms | P95: 0.0456ms | P99: 0.0789ms
   Min: 0.0123ms | Max: 1.2345ms
   Throughput: 42,735 ops/sec
   Memory: +0.12MB
```

### Metrics Explained

- **Avg**: Average execution time
- **P50**: 50th percentile (median)
- **P95**: 95th percentile (95% of requests faster)
- **P99**: 99th percentile (99% of requests faster)
- **Min/Max**: Fastest and slowest execution
- **Throughput**: Operations per second
- **Memory**: Memory delta during test

### What's Good Performance?

**Cache Operations:**
- Set: < 0.1ms average
- Get: < 0.05ms average
- Throughput: > 10,000 ops/sec

**Routing:**
- Route matching: < 0.01ms
- Parameter extraction: < 0.01ms
- Throughput: > 50,000 ops/sec

**Middleware:**
- Single middleware: < 0.01ms
- Chain (3): < 0.03ms
- Throughput: > 30,000 ops/sec

**Throttle:**
- Rate check: < 0.01ms
- Policy eval: < 0.01ms
- Throughput: > 50,000 ops/sec

**HTTP (end-to-end):**
- Simple GET: < 5ms
- JSON response: < 10ms
- Throughput: > 200 req/sec

## Running with More Memory

For better accuracy, run with garbage collection exposed:

```bash
node --expose-gc benchmark/run-benchmarks.js
```

## Comparing Results

### Export Results

```javascript
import { BenchmarkRunner } from './run-benchmarks.js';

const runner = new BenchmarkRunner();
// ... run benchmarks ...

const json = runner.exportResults('json');
console.log(json);
```

### Baseline Comparison

Save baseline results:
```bash
npm run benchmark > baseline.txt
```

Compare after changes:
```bash
npm run benchmark > current.txt
diff baseline.txt current.txt
```

## Optimization Tips

### If Cache is Slow:
- Check if using correct adapter for your workload
- Memory adapter is fastest for small data
- Redis for large distributed cache
- Consider object size and serialization overhead

### If Routing is Slow:
- Reduce number of routes
- Use route prefixes to organize
- Avoid complex regex patterns
- Consider route caching

### If Middleware is Slow:
- Minimize middleware chain length
- Avoid heavy computation in middleware
- Use async carefully (overhead)
- Cache middleware results when possible

### If Throttle is Slow:
- Simplify policy logic
- Cache policy results
- Use memory adapter for throttle data
- Consider fingerprint complexity

## Hardware Impact

Performance varies by hardware:
- **CPU**: Faster = better throughput
- **RAM**: More = better for large caches
- **Disk I/O**: Affects database adapters
- **Network**: Affects remote cache (Redis, etc)

## Continuous Monitoring

Run benchmarks:
- Before releases
- After major changes
- On different environments
- Under different loads
