/**
 * Enterprise Full-Featured Example
 * Demonstrates all Triva features in production configuration
 */

import {
  build,
  get,
  post,
  use,
  listen,
  cache,
  log,
  errorTracker,
  cookieParser
} from '../lib/index.js';

async function main() {
  console.log('🚀 Starting Enterprise Example...\n');

  // Full enterprise configuration
  await build({
    env: 'production',

    // Redis for high-performance caching
    cache: {
      type: 'redis',
      retention: 7200000,
      database: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
        password: process.env.REDIS_PASSWORD
      }
    },

    // Advanced throttling with policies
    throttle: {
      limit: 1000,
      window_ms: 60000,
      burst_limit: 100,
      ban_threshold: 10,
      ban_duration_ms: 3600000,
      policies: ({ context }) => {
        // Different limits for different endpoints
        if (context.pathname?.startsWith('/api/admin')) {
          return { limit: 50, window_ms: 60000 };
        }
        if (context.pathname?.startsWith('/api/public')) {
          return { limit: 2000, window_ms: 60000 };
        }
        if (context.pathname?.startsWith('/api/webhook')) {
          return { limit: 10, window_ms: 1000 };
        }
      }
    },

    // Request logging
    retention: {
      enabled: true,
      maxEntries: 500000
    },

    // Error tracking
    errorTracking: {
      enabled: true,
      maxEntries: 100000
    }
  });

  console.log('✅ Enterprise Triva built!\n');

  // Use cookie parser
  use(cookieParser());

  // Health check
  get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Public API with high rate limit
  get('/api/public/data', async (req, res) => {
    const cached = await cache.get('public:data');
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    const data = { message: 'Public data', items: [1, 2, 3] };
    await cache.set('public:data', data, 300000);

    res.json({ source: 'database', data });
  });

  // Admin API with strict rate limiting
  get('/api/admin/users', async (req, res) => {
    // Check admin cookie
    if (!req.cookies.admin_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      users: [
        { id: 1, name: 'Admin User', role: 'admin' },
        { id: 2, name: 'Regular User', role: 'user' }
      ]
    });
  });

  // Admin login
  post('/api/admin/login', async (req, res) => {
    const { username, password } = await req.json();

    // Simulate authentication
    if (username === 'admin' && password === 'admin') {
      res.cookie('admin_token', 'secure_token_here', {
        httpOnly: true,
        secure: true,
        maxAge: 86400000 // 24 hours
      });

      return res.json({ message: 'Login successful' });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  });

  // Webhook endpoint (very strict rate limit)
  post('/api/webhook/payment', async (req, res) => {
    const data = await req.json();

    console.log('💰 Payment webhook received:', data);

    // Process webhook
    res.status(200).json({ received: true });
  });

  // Export logs endpoint
  get('/api/admin/logs/export', async (req, res) => {
    if (!req.cookies.admin_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 1000, severity } = req.query;

    const result = await log.export({
      limit: parseInt(limit),
      severity
    });

    res.json({
      exported: result.count,
      timestamp: new Date().toISOString()
    });
  });

  // Error tracking endpoint
  get('/api/admin/errors', async (req, res) => {
    if (!req.cookies.admin_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const errors = await errorTracker.get({
      limit: 100,
      severity: req.query.severity,
      resolved: req.query.resolved === 'true'
    });

    res.json({ errors });
  });

  // Resolve error
  post('/api/admin/errors/:id/resolve', async (req, res) => {
    if (!req.cookies.admin_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await errorTracker.resolve(req.params.id);

    res.json({ message: 'Error resolved' });
  });

  // Intentional error for testing
  get('/api/test/error', (req, res) => {
    throw new Error('This is a test error for error tracking');
  });

  // Cache stats
  get('/api/admin/cache/stats', async (req, res) => {
    if (!req.cookies.admin_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // This would require cache stats implementation
    res.json({
      message: 'Cache stats endpoint',
      note: 'Implement based on your cache adapter'
    });
  });

  const port = process.env.PORT || 3004;
  listen(port);

  console.log(`\n📡 Enterprise Server running on http://localhost:${port}`);
  console.log(`\n📝 Public Endpoints:`);
  console.log(`   GET  http://localhost:${port}/health`);
  console.log(`   GET  http://localhost:${port}/api/public/data`);
  console.log(`\n🔐 Admin Endpoints (require authentication):`);
  console.log(`   POST http://localhost:${port}/api/admin/login`);
  console.log(`   GET  http://localhost:${port}/api/admin/users`);
  console.log(`   GET  http://localhost:${port}/api/admin/logs/export`);
  console.log(`   GET  http://localhost:${port}/api/admin/errors`);
  console.log(`   POST http://localhost:${port}/api/admin/errors/:id/resolve`);
  console.log(`\n🎯 Testing:`);
  console.log(`   GET  http://localhost:${port}/api/test/error`);
  console.log(`\n💡 Login with: { "username": "admin", "password": "admin" }`);
}

main().catch(console.error);
