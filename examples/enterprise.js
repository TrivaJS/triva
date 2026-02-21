/**
 * Enterprise Full-Featured Example
 * Production configuration: tiered throttle policies, isAI/isBot/isCrawler
 * middleware pattern replacing the old redirects config.
 */

import {
  build, cache, log, errorTracker, cookieParser,
  isAI, isBot, isCrawler
} from '../lib/index.js';

async function main() {
  console.log('🚀 Starting Enterprise Example...\n');

  const instanceBuild = new build({
    env: 'production',

    cache: {
      type:      'redis',
      retention: 7200000,
      database: {
        host:     process.env.REDIS_HOST || 'localhost',
        port:     6379,
        password: process.env.REDIS_PASSWORD
      }
    },

    // Throttle policies now receive the full req object as context
    throttle: {
      limit:          1000,
      window_ms:      60000,
      burst_limit:    100,
      ban_threshold:  10,
      ban_ms:         3600000,
      policies: (req) => {
        if (req.url?.startsWith('/api/admin'))   return { limit: 50,   window_ms: 60000 };
        if (req.url?.startsWith('/api/public'))  return { limit: 2000, window_ms: 60000 };
        if (req.url?.startsWith('/api/webhook')) return { limit: 10,   window_ms: 1000  };
        return null;
      }
    },

    retention:     { enabled: true, maxEntries: 500000 },
    errorTracking: { enabled: true, maxEntries: 100000 }
  });

  console.log('✅ Enterprise Triva built!\n');

  instanceBuild.use(cookieParser());

  // UA-based traffic routing — lightweight, composable, no config bloat
  instanceBuild.use(async (req, res, next) => {
    const ua = req.headers['user-agent'] || '';

    if (await isAI(ua) && req.url?.startsWith('/api')) {
      // Route AI scrapers to a dedicated infrastructure endpoint
      const dest = `https://ai.${process.env.BASE_DOMAIN || 'example.com'}${req.url}`;
      return res.redirect(dest, 302);
    }

    if (await isBot(ua) && req.url.startsWith('/api/admin')) {
      return res.status(403).json({ error: 'Bot traffic not allowed on admin endpoints' });
    }

    next();
  });

  instanceBuild.get('/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  instanceBuild.get('/api/public/data', async (req, res) => {
    const cached = await cache.get('public:data');
    if (cached) return res.json({ source: 'cache', data: cached });

    const data = { message: 'Public data', items: [1, 2, 3] };
    await cache.set('public:data', data, 300000);
    res.json({ source: 'database', data });
  });

  instanceBuild.get('/api/admin/users', async (req, res) => {
    if (!req.cookies.admin_token) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ users: [{ id: 1, name: 'Admin', role: 'admin' }] });
  });

  instanceBuild.post('/api/admin/login', async (req, res) => {
    const { username, password } = await req.json();
    if (username === 'admin' && password === 'admin') {
      res.cookie('admin_token', 'secure_token', { httpOnly: true, secure: true, maxAge: 86400000 });
      return res.json({ message: 'Login successful' });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });

  instanceBuild.post('/api/webhook/payment', async (req, res) => {
    const data = await req.json();
    console.log('💰 Payment webhook:', data);
    res.status(200).json({ received: true });
  });

  instanceBuild.get('/api/admin/logs/export', async (req, res) => {
    if (!req.cookies.admin_token) return res.status(401).json({ error: 'Unauthorized' });
    const result = await log.export({ limit: parseInt(req.query.limit || '1000') });
    res.json({ exported: result.count, timestamp: new Date().toISOString() });
  });

  instanceBuild.get('/api/admin/errors', async (req, res) => {
    if (!req.cookies.admin_token) return res.status(401).json({ error: 'Unauthorized' });
    const errors = await errorTracker.get({ limit: 100 });
    res.json({ errors });
  });

  instanceBuild.get('/api/test/error', (req, res) => {
    throw new Error('Test error for error tracking');
  });

  // UA detection utility endpoint
  instanceBuild.get('/api/ua', (req, res) => {
    const ua = req.query.ua || req.headers['user-agent'] || '';
    res.json({ ua, isAI: isAI(ua), isBot: isBot(ua), isCrawler: isCrawler(ua) });
  });

  const port = process.env.PORT || 3004;
  instanceBuild.listen(port);

  console.log(`\n📡 Enterprise Server running on http://localhost:${port}`);
  console.log('\n💡 Login: POST /api/admin/login  { "username":"admin","password":"admin" }');
}

main().catch(console.error);
