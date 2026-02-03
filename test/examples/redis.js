/**
 * Redis Example
 * Shows how to use Triva with Redis for high-performance caching
 */

import { build, get, post, listen, cache } from '../../lib/index.js';

async function main() {
  console.log('🚀 Starting Redis Example...\n');

  // Build with Redis configuration
  await build({
    env: 'production',
    cache: {
      type: 'redis',
      retention: 7200000, // 2 hours
      database: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: 0
      }
    },
    throttle: {
      limit: 500,
      window_ms: 60000,
      burst_limit: 50
    }
  });

  console.log('✅ Triva built with Redis!\n');

  // High-frequency endpoint with caching
  get('/api/stats', async (req, res) => {
    const cacheKey = 'stats:current';

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        ...cached
      });
    }

    // Simulate expensive calculation
    const stats = {
      users: Math.floor(Math.random() * 10000),
      revenue: Math.floor(Math.random() * 100000),
      orders: Math.floor(Math.random() * 5000),
      timestamp: new Date().toISOString()
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, stats, 300000);

    res.json({
      source: 'computed',
      ...stats
    });
  });

  // Session-like caching
  post('/sessions', async (req, res) => {
    const { userId } = await req.json();
    const sessionId = `session:${Date.now()}:${userId}`;

    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    await cache.set(sessionId, sessionData, 3600000); // 1 hour

    res.json({
      message: 'Session created',
      sessionId,
      data: sessionData
    });
  });

  get('/sessions/:id', async (req, res) => {
    const session = await cache.get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    res.json({ data: session });
  });

  const port = 3002;
  listen(port);

  console.log(`\n📡 Server running on http://localhost:${port}`);
  console.log(`\n📝 Try these endpoints:`);
  console.log(`   GET  http://localhost:${port}/api/stats`);
  console.log(`   POST http://localhost:${port}/sessions`);
  console.log(`   GET  http://localhost:${port}/sessions/[id]`);
  console.log(`\n💡 Make sure Redis is running on localhost:6379`);
}

main().catch(console.error);
