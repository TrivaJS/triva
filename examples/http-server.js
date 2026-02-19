/**
 * HTTP Server Example
 * Demonstrates standard HTTP server (default)
 */

import { build } from '../lib/index.js';

async function startHTTPServer() {
  const instanceBuild = new build({
    env: 'development',
    // protocol: 'http' is default, can be omitted
    cache: {
      type: 'memory',
      retention: 3600000
    },
    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  // Define routes
  instanceBuild.get('/', (req, res) => {
    res.json({
      message: 'Triva HTTP Server',
      protocol: 'http'
    });
  });

  instanceBuild.get('/api/data', (req, res) => {
    res.json({
      data: [1, 2, 3, 4, 5],
      timestamp: new Date().toISOString()
    });
  });

  // Start HTTP server on port 3000
  instanceBuild.listen(3000);
}

startHTTPServer().catch(err => {
  console.error('Failed to start HTTP server:', err);
  process.exit(1);
});
