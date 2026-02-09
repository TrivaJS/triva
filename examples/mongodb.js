/**
 * MongoDB Example
 * Shows how to use Triva with MongoDB for caching
 */

import { build, get, post, listen, cache } from '../lib/index.js';

async function main() {
  console.log('🚀 Starting MongoDB Example...\n');

  // Build with MongoDB configuration
  await build({
    env: 'development',
    cache: {
      type: 'mongodb',
      retention: 3600000, // 1 hour
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database: 'triva_cache',
        collection: 'cache_entries'
      }
    },
    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  console.log('✅ Triva built with MongoDB!\n');

  // Example: Cached endpoint
  get('/products', async (req, res) => {
    const cacheKey = 'products:all';

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('📦 Returning cached products');
      return res.json({
        source: 'cache',
        data: cached
      });
    }

    // Simulate database fetch
    console.log('🔍 Fetching products from database...');
    const products = [
      { id: 1, name: 'Product 1', price: 29.99 },
      { id: 2, name: 'Product 2', price: 49.99 },
      { id: 3, name: 'Product 3', price: 19.99 }
    ];

    // Cache for 1 hour
    await cache.set(cacheKey, products, 3600000);

    res.json({
      source: 'database',
      data: products
    });
  });

  // Example: Cache individual product
  get('/products/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `product:${id}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    // Simulate fetch
    const product = { id, name: `Product ${id}`, price: 29.99 };
    await cache.set(cacheKey, product, 3600000);

    res.json({ source: 'database', data: product });
  });

  // Clear cache endpoint
  post('/cache/clear', async (req, res) => {
    const { pattern } = await req.json();
    const deleted = await cache.delete(pattern || 'products:*');
    res.json({
      message: 'Cache cleared',
      deleted
    });
  });

  const port = 3001;
  listen(port);

  console.log(`\n📡 Server running on http://localhost:${port}`);
  console.log(`\n📝 Try these endpoints:`);
  console.log(`   GET  http://localhost:${port}/products (cached)`);
  console.log(`   GET  http://localhost:${port}/products/123`);
  console.log(`   POST http://localhost:${port}/cache/clear`);
  console.log(`\n💡 Make sure MongoDB is running on localhost:27017`);
}

main().catch(console.error);
