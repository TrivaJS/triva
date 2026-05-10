/**
 * HTTPS Server Example
 * Demonstrates how to run Triva with HTTPS
 */

import { build } from '../lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// For development: Generate self-signed certificates
// openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
//   -keyout localhost-key.pem -out localhost-cert.pem

async function startHTTPSServer() {
  const instanceBuild = new build({
    env: 'development',
    protocol: 'https',
    ssl: {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-cert.pem')),
      // Optional additional options
      options: {
        // Enable HTTP/2 if needed
        // allowHTTP1: true
      }
    },
    cache: {
      type: 'memory',
      retention: 3600000
    },
    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  // Define routes (same as HTTP)
  instanceBuild.get('/', (req, res) => {
    res.json({
      message: 'Secure Triva HTTPS Server',
      protocol: 'https',
      secure: true
    });
  });

  instanceBuild.get('/api/data', (req, res) => {
    res.json({
      data: [1, 2, 3, 4, 5],
      timestamp: new Date().toISOString()
    });
  });

  // Start HTTPS server on port 443 (or 3443 for development)
  instanceBuild.listen(3443);
}

startHTTPSServer().catch(err => {
  console.error('Failed to start HTTPS server:', err);
  process.exit(1);
});
