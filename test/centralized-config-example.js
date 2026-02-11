/*!
 * Centralized Configuration Example
 * Shows all configuration in build()
 */

import { build, get, post, use, listen, cookieParser } from 'triva';

console.log('🎯 Centralized Configuration Demo\n');

// ============================================================================
// ALL CONFIGURATION IN ONE PLACE
// ============================================================================

await build({
  env: 'development',
  
  // Cache Configuration
  cache: {
    type: 'memory',        // or 'mongodb', 'redis', 'postgresql', 'mysql'
    retention: 600000,     // 10 minutes
    limit: 10000,
    
    // Database configuration (only needed for non-memory types)
    database: {
      // MongoDB example:
      // uri: 'mongodb://localhost:27017',
      // database: 'triva',
      // collection: 'cache',
      
      // Redis example:
      // host: 'localhost',
      // port: 6379,
      
      // PostgreSQL example:
      // host: 'localhost',
      // port: 5432,
      // database: 'triva',
      // user: 'postgres',
      // password: 'password',
      // tableName: 'triva_cache',
      
      // MySQL example:
      // host: 'localhost',
      // port: 3306,
      // database: 'triva',
      // user: 'root',
      // password: 'password',
      // tableName: 'triva_cache'
    }
  },
  
  // Throttle Configuration
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 20,
    burst_window_ms: 1000,
    ban_threshold: 5,
    ban_ms: 300000,
    ua_rotation_threshold: 5
  },
  
  // Log Retention Configuration
  retention: {
    enabled: true,
    maxEntries: 10000
  },
  
  // Error Tracking Configuration
  errorTracking: {
    enabled: true,
    maxEntries: 5000,
    captureStackTrace: true,
    captureContext: true,
    captureSystemInfo: true
  }
});

console.log('✅ Server configured with centralized settings\n');

// ============================================================================
// Add Custom Middleware (still supported!)
// ============================================================================

use(cookieParser());

use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// Routes
// ============================================================================

get('/', (req, res) => {
  res.json({
    message: 'Centralized configuration working!',
    config: {
      cache: 'memory',
      throttle: 'enabled',
      retention: 'enabled',
      errorTracking: 'enabled'
    },
    endpoints: {
      '/': 'This page',
      '/test-cache': 'Test caching',
      '/test-throttle': 'Test rate limiting',
      '/test-error': 'Trigger error tracking'
    }
  });
});

get('/test-cache', async (req, res) => {
  const { cache } = await import('triva');
  
  // Set cache
  await cache.set('test-key', { data: 'cached value' }, 60000);
  
  // Get cache
  const cached = await cache.get('test-key');
  
  // Get stats
  const stats = await cache.stats();
  
  res.json({
    message: 'Cache test',
    cached,
    stats
  });
});

get('/test-throttle', (req, res) => {
  res.json({
    message: 'If you see this, you passed throttle check',
    throttle: req.triva?.throttle
  });
});

get('/test-error', (req, res) => {
  throw new Error('Test error for tracking');
});

post('/echo', async (req, res) => {
  const body = await req.json();
  res.json({ echo: body });
});

// ============================================================================
// Start Server
// ============================================================================

listen(3000, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Server Running with Centralized Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🌐 http://localhost:3000');
  console.log('');
  console.log('Configuration:');
  console.log('  ✅ Cache: memory (10min TTL, 10k limit)');
  console.log('  ✅ Throttle: 100 req/min, burst: 20 req/sec');
  console.log('  ✅ Retention: 10,000 log entries');
  console.log('  ✅ Error Tracking: 5,000 errors');
  console.log('');
  console.log('Try:');
  console.log('  curl http://localhost:3000/');
  console.log('  curl http://localhost:3000/test-cache');
  console.log('  curl http://localhost:3000/test-throttle');
  console.log('  curl http://localhost:3000/test-error');
  console.log('');
});
