/**
 * PostgreSQL Example
 * Shows how to use Triva with PostgreSQL for enterprise caching
 */

import { build, get, post, listen, cache } from '../lib/index.js';

async function main() {
  console.log('🚀 Starting PostgreSQL Example...\n');

  // Build with PostgreSQL configuration
  await build({
    env: 'production',
    cache: {
      type: 'postgresql',
      retention: 7200000, // 2 hours
      database: {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'triva',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production'
      }
    },
    throttle: {
      limit: 500,
      window_ms: 60000,
      ban_threshold: 5,
      policies: ({ context }) => {
        if (context.pathname?.startsWith('/api/admin')) {
          return { limit: 50 };
        }
      }
    },
    retention: {
      enabled: true,
      maxEntries: 100000
    },
    errorTracking: {
      enabled: true,
      maxEntries: 25000
    }
  });

  console.log('✅ Triva built with PostgreSQL!\n');

  // Complex query caching
  get('/api/reports/sales', async (req, res) => {
    const { startDate, endDate } = req.query;
    const cacheKey = `report:sales:${startDate}:${endDate}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        data: cached
      });
    }

    // Simulate complex query
    const report = {
      period: { start: startDate, end: endDate },
      totalSales: Math.floor(Math.random() * 1000000),
      transactions: Math.floor(Math.random() * 10000),
      avgOrderValue: Math.floor(Math.random() * 100),
      topProducts: [
        { id: 1, name: 'Product A', sales: 45000 },
        { id: 2, name: 'Product B', sales: 32000 }
      ]
    };

    // Cache for 30 minutes
    await cache.set(cacheKey, report, 1800000);

    res.json({
      source: 'database',
      data: report
    });
  });

  // User preferences caching
  get('/api/users/:id/preferences', async (req, res) => {
    const cacheKey = `user:${req.params.id}:preferences`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Simulate database fetch
    const preferences = {
      userId: req.params.id,
      theme: 'dark',
      language: 'en',
      notifications: true,
      timezone: 'UTC'
    };

    await cache.set(cacheKey, preferences);

    res.json(preferences);
  });

  post('/api/users/:id/preferences', async (req, res) => {
    const { id } = req.params;
    const preferences = await req.json();

    // Update cache
    const cacheKey = `user:${id}:preferences`;
    await cache.set(cacheKey, preferences);

    res.json({
      message: 'Preferences updated',
      data: preferences
    });
  });

  const port = 3003;
  listen(port);

  console.log(`\n📡 Server running on http://localhost:${port}`);
  console.log(`\n📝 Try these endpoints:`);
  console.log(`   GET  http://localhost:${port}/api/reports/sales?startDate=2024-01-01&endDate=2024-12-31`);
  console.log(`   GET  http://localhost:${port}/api/users/123/preferences`);
  console.log(`   POST http://localhost:${port}/api/users/123/preferences`);
  console.log(`\n💡 Make sure PostgreSQL is running with credentials in .env`);
}

main().catch(console.error);
