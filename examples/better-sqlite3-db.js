/**
 * Better-SQLite3 Database Example
 * Faster synchronous SQLite driver
 *
 * Prerequisites:
 * npm install better-sqlite3
 */

import { build } from '../lib/index.js';

async function main() {
  const instanceBuild = new build({
    env: 'production',

    cache: {
      type: 'better-sqlite3',
      database: {
        filename: './cache.db'
      }
    },

    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  instanceBuild.get('/', (req, res) => {
    res.json({
      message: 'Better-SQLite3 Database Example',
      database: 'better-sqlite3 (faster)',
      location: './cache.db'
    });
  });

  instanceBuild.get('/api/products', (req, res) => {
    // Cached in Better-SQLite3
    res.json({
      products: [
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 19.99 }
      ]
    });
  });

  instanceBuild.post('/api/products', async (req, res) => {
    const product = await req.json();
    res.status(201).json({
      message: 'Product created',
      product
    });
  });

  instanceBuild.listen(3000);

  console.log('\n✅ Server running with Better-SQLite3 database');
  console.log('📁 Database file: ./cache.db');
  console.log('⚡ Performance: Faster than sqlite3\n');
}

main().catch(console.error);
