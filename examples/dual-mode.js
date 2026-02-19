/**
 * Dual Mode Example
 * Run both HTTP and HTTPS servers simultaneously
 */

import { build, get } from '../lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startDualServers() {
  // HTTP Server
  const httpServer = new build({
    env: 'production',
    protocol: 'http',
    cache: { type: 'memory' },
    throttle: { limit: 100, window_ms: 60000 }
  });

  httpServer.get('/', (req, res) => {
    res.json({ server: 'HTTP', port: 3000 });
  });

  httpServer.get('/redirect-to-https', (req, res) => {
    const host = req.headers.host.split(':')[0];
    res.redirect(`https://${host}:3443${req.url}`, 301);
  });

  const http = httpServer.listen(3000);

  // HTTPS Server
  const httpsServer = new build({
    env: 'production',
    protocol: 'https',
    ssl: {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-cert.pem'))
    },
    cache: { type: 'memory' },
    throttle: { limit: 100, window_ms: 60000 }
  });

  httpsServer.get('/', (req, res) => {
    res.json({ server: 'HTTPS', port: 3443, secure: true });
  });

  httpsServer.get('/api/secure', (req, res) => {
    res.json({
      message: 'This is a secure endpoint',
      protocol: 'https'
    });
  });

  const https = httpsServer.listen(3443);

  console.log('✅ HTTP server running on http://localhost:3000');
  console.log('✅ HTTPS server running on https://localhost:3443');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down servers...');
    http.close();
    https.close();
  });
}

startDualServers().catch(err => {
  console.error('Failed to start servers:', err);
  process.exit(1);
});
