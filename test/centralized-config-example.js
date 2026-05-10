/*!
 * Centralized Configuration Example
 * Demonstrates all configuration inside build() — class-based API
 * UA helpers: isAI, isBot, isCrawler replace the old redirects config
 */

import { build, cache, cookieParser, isAI, isBot, isCrawler } from 'triva';

console.log('🎯 Centralized Configuration Demo\n');

// ─── All configuration in build() ────────────────────────────────────────────

const instanceBuild = new build({
  env: 'development',

  cache: {
    type:      'memory',
    retention: 600000,   // 10 minutes
    limit:     10000
  },

  throttle: {
    limit:               100,
    window_ms:           60000,
    burst_limit:         20,
    burst_window_ms:     1000,
    ban_threshold:       5,
    ban_ms:              300000,
    ua_rotation_threshold: 5,

    // Tiered rate-limit policies receive the full req object as context
    policies: (req) => {
      if (req.url?.startsWith('/api/admin'))  return { limit: 30,  window_ms: 60000 };
      if (req.url?.startsWith('/api/public')) return { limit: 500, window_ms: 60000 };
      return null; // fall back to base config
    }
  },

  retention:     { enabled: true, maxEntries: 10000 },
  errorTracking: { enabled: true, maxEntries: 5000,  captureStackTrace: true }
});

console.log('✅ Server configured with centralized settings\n');

// ─── Middleware ───────────────────────────────────────────────────────────────

instanceBuild.use(cookieParser());

instanceBuild.use(async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Lightweight UA-based routing — no config bloat, full developer control
 instanceBuild.use(async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (await isAI(ua))
    return res.redirect('https://ai.example.com' + req.url, 302);
  if ((await isBot(ua)) && req.url.startsWith('/secure'))
    return res.status(403).json({ error: 'Forbidden' });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

instanceBuild.get('/', (req, res) => {
  res.json({
    message: 'Centralized configuration working!',
    config: {
      cache:        'memory (10 min TTL)',
      throttle:     '100 req/min with tiered policies',
      retention:    '10,000 log entries',
      errorTracking: '5,000 errors'
    },
    endpoints: {
      '/':             'This page',
      '/api/cache':    'Test caching',
      '/api/throttle': 'Test rate limiting',
      '/api/ua':       'Test UA detection',
      '/api/error':    'Trigger error tracking'
    }
  });
});

instanceBuild.get('/api/cache', async (req, res) => {
  await cache.set('demo:key', { data: 'cached value' }, 60000);
  const cached = await cache.get('demo:key');
  const stats  = await cache.stats();
  res.json({ message: 'Cache test', cached, stats });
});

instanceBuild.get('/api/throttle', (req, res) => {
  res.json({
    message: 'Throttle check passed',
    throttle: req.triva?.throttle
  });
});

// UA detection — using the new isAI / isBot / isCrawler imports
instanceBuild.get('/api/ua', (req, res) => {
  const ua = req.query.ua || req.headers['user-agent'] || '';
  res.json({ ua, isAI: isAI(ua), isBot: isBot(ua), isCrawler: isCrawler(ua) });
});

instanceBuild.get('/api/error', (req, res) => {
  throw new Error('Test error for tracking');
});

instanceBuild.post('/echo', async (req, res) => {
  const body = await req.json();
  res.json({ echo: body });
});

// ─── Start ────────────────────────────────────────────────────────────────────

instanceBuild.listen(3000, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Server Running with Centralized Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🌐 http://localhost:3000');
  console.log('');
  console.log('Try:');
  console.log('  curl http://localhost:3000/api/cache');
  console.log('  curl http://localhost:3000/api/throttle');
  console.log('  curl "http://localhost:3000/api/ua?ua=GPTBot/1.0"');
  console.log('  curl http://localhost:3000/api/error');
  console.log('');
});
