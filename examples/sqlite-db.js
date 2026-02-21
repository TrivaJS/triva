/**
 * SQLite Database Example
 *
 * Prerequisites:
 * npm install sqlite3
 */

import { build } from '../lib/index.js';

async function main() {
  const instanceBuild = new build({
    env: 'production',

    cache: {
      type: 'sqlite',
      database: {
        filename: './cache.sqlite'
      }
    },

    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  instanceBuild.get('/', (req, res) => {
    res.json({
      message: 'SQLite Database Example',
      database: 'sqlite3',
      location: './cache.sqlite'
    });
  });

  instanceBuild.get('/api/users', (req, res) => {
    // Cached in SQLite
    res.json({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    });
  });

  instanceBuild.post('/api/users', async (req, res) => {
    const user = await req.json();
    res.status(201).json({
      message: 'User created',
      user
    });
  });

  instanceBuild.listen(3000);

  console.log('\n✅ Server running with SQLite database');
  console.log('📁 Database file: ./cache.sqlite\n');
}

main().catch(console.error);
