/**
 * Embedded Database Example
 * Encrypted JSON file storage
 */

import { build } from '../lib/index.js';

async function main() {
  const instanceBuild = new build({
    env: 'development',

    cache: {
      type: 'embedded',
      database: {
        filename: './my-app-cache.db',  // Custom filename
        encryptionKey: process.env.DB_ENCRYPTION_KEY || 'my-secret-key-change-in-production'
      }
    },

    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  instanceBuild.get('/', (req, res) => {
    res.json({
      message: 'Embedded Database Example',
      database: 'encrypted JSON file',
      location: './my-app-cache.db'
    });
  });

  instanceBuild.get('/api/data', (req, res) => {
    // This response will be cached in the encrypted file
    res.json({
      data: [1, 2, 3, 4, 5],
      timestamp: new Date().toISOString()
    });
  });

  instanceBuild.post('/api/data', async (req, res) => {
    const body = await req.json();
    res.status(201).json({
      message: 'Data received',
      data: body
    });
  });

  instanceBuild.listen(3000);

  console.log('\n✅ Server running with Embedded database');
  console.log('📁 Database file: ./my-app-cache.db');
  console.log('🔒 Encryption: Enabled\n');
}

main().catch(console.error);
