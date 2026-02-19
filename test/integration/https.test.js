/**
 * HTTPS Integration Tests
 * Tests HTTPS server using class-based build API
 * Gracefully skips if OpenSSL is unavailable
 */

import assert    from 'assert';
import https     from 'https';
import fs        from 'fs';
import path      from 'path';
import os        from 'os';
import { execSync }     from 'child_process';
import { fileURLToPath } from 'url';
import { build } from '../../lib/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT      = 9996;
let server, certDir, keyPath, certPath, caCert;

function makeRequest(method, reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname:            'localhost',
      port:                PORT,
      path:                reqPath,
      method,
      ca:                  caCert,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const tests = {
  async 'Setup - generate test certificates'() {
    certDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'triva-https-test-'));
    keyPath  = path.join(certDir, 'key.pem');
    certPath = path.join(certDir, 'cert.pem');

    const opensslCmd = process.platform === 'win32' ? 'openssl.exe' : 'openssl';
    try {
      execSync(
        `${opensslCmd} req -x509 -newkey rsa:2048 -nodes -sha256 ` +
        `-subj "/CN=localhost" -keyout "${keyPath}" -out "${certPath}" -days 1`,
        { stdio: 'pipe' }
      );
      caCert = fs.readFileSync(certPath);
    } catch {
      throw new Error('OpenSSL not available. Install OpenSSL to run HTTPS tests.');
    }
  },

  async 'Setup - build HTTPS application'() {
    const buildInstance = new build({
      env:      'test',
      protocol: 'https',
      ssl: {
        key:  fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      },
      cache: { type: 'memory', retention: 60000 }
    });

    buildInstance.get('/api/test', (req, res) => {
      res.json({ message: 'test', protocol: 'https' });
    });

    buildInstance.post('/api/data', async (req, res) => {
      const body = await req.json();
      res.status(201).json({ received: body, secure: true });
    });

    server = buildInstance.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async 'HTTPS - GET request works'() {
    const r = await makeRequest('GET', '/api/test');
    assert.strictEqual(r.statusCode, 200);
    const body = JSON.parse(r.body);
    assert.strictEqual(body.message, 'test');
    assert.strictEqual(body.protocol, 'https');
  },

  async 'HTTPS - POST request works'() {
    const payload = { name: 'test', value: 123 };
    const r = await makeRequest('POST', '/api/data', JSON.stringify(payload));
    assert.strictEqual(r.statusCode, 201);
    const body = JSON.parse(r.body);
    assert.deepStrictEqual(body.received, payload);
    assert.strictEqual(body.secure, true);
  },

  async 'HTTPS - Server type is HTTPS'() {
    const r = await makeRequest('GET', '/api/test');
    assert.strictEqual(JSON.parse(r.body).protocol, 'https');
  },

  'Cleanup - close server and remove certs'() {
    if (server) server.close();
    try {
      if (certDir && fs.existsSync(certDir)) {
        if (fs.existsSync(keyPath))  fs.unlinkSync(keyPath);
        if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
        fs.rmdirSync(certDir);
      }
    } catch { /* ignore */ }
  }
};

async function runTests() {
  console.log('🧪 Running HTTPS Integration Tests\n');
  let passed = 0, failed = 0, skipped = false;

  for (const [name, test] of Object.entries(tests)) {
    if (skipped) { console.log(`  ⏭️  ${name}`); continue; }

    try {
      await test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
      failed++;
      if (name.includes('Setup - generate')) {
        console.log('\n  ⚠️  Skipping remaining HTTPS tests (OpenSSL not available)\n');
        skipped = true;
      }
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (skipped) { console.log('ℹ️  HTTPS tests skipped — install OpenSSL to enable'); process.exit(0); }
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests();
