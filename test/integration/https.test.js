/**
 * HTTPS Integration Tests
 * Tests HTTPS server functionality
 */

import assert from 'assert';
import https from 'https';
import { build, get, post, listen } from '../../lib/index.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = 9998;
let server;
let certDir;
let keyPath;
let certPath;

// Test suite
const tests = {
  async 'Setup - generate test certificates'() {
    // Create temporary directory for test certificates
    certDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triva-test-'));
    keyPath = path.join(certDir, 'test-key.pem');
    certPath = path.join(certDir, 'test-cert.pem');
    
    // Generate self-signed certificate for testing
    try {
      const opensslCmd = process.platform === 'win32' ? 'openssl.exe' : 'openssl';
      
      execSync(
        `${opensslCmd} req -x509 -newkey rsa:2048 -nodes -sha256 ` +
        `-subj "/CN=localhost" ` +
        `-keyout "${keyPath}" ` +
        `-out "${certPath}" ` +
        `-days 1`,
        { stdio: 'pipe' }
      );
      
      console.log('  📝 Test certificates generated');
    } catch (err) {
      throw new Error(
        'OpenSSL not available. Install OpenSSL to run HTTPS tests.\n' +
        '  Windows: https://slproweb.com/products/Win32OpenSSL.html\n' +
        '  Or skip this test: npm run test:unit && npm run test:integration'
      );
    }
  },

  async 'Setup - build HTTPS application'() {
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    
    await build({
      env: 'test',
      protocol: 'https',
      ssl: {
        key: key,
        cert: cert
      },
      cache: {
        type: 'memory',
        retention: 60000
      }
    });

    // Set up test routes
    get('/api/test', (req, res) => {
      res.json({ message: 'test', protocol: 'https' });
    });

    post('/api/data', async (req, res) => {
      const body = await req.json();
      res.status(201).json({ received: body, secure: true });
    });

    server = listen(port);
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async 'HTTPS - GET request works'() {
    const response = await makeRequest('GET', '/api/test');
    assert.strictEqual(response.statusCode, 200);
    
    const data = JSON.parse(response.body);
    assert.strictEqual(data.message, 'test');
    assert.strictEqual(data.protocol, 'https');
  },

  async 'HTTPS - POST request works'() {
    const payload = { name: 'test', value: 123 };
    const response = await makeRequest('POST', '/api/data', JSON.stringify(payload));
    
    assert.strictEqual(response.statusCode, 201);
    const data = JSON.parse(response.body);
    assert.deepStrictEqual(data.received, payload);
    assert.strictEqual(data.secure, true);
  },

  async 'HTTPS - Server type is HTTPS'() {
    // Verify server is actually HTTPS by checking the protocol
    const response = await makeRequest('GET', '/api/test');
    const data = JSON.parse(response.body);
    assert.strictEqual(data.protocol, 'https');
  },

  'Cleanup - close server'() {
    if (server) {
      server.close();
    }
    
    // Clean up temporary certificates
    if (certDir && fs.existsSync(certDir)) {
      try {
        if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
        if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
        fs.rmdirSync(certDir);
        console.log('  🧹 Test certificates cleaned up');
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
};

// Helper function to make HTTPS requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false // Accept self-signed certificates
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('🧪 Running HTTPS Tests\n');
  
  let passed = 0;
  let failed = 0;
  let skipped = false;
  
  for (const [name, test] of Object.entries(tests)) {
    if (skipped) {
      console.log(`  ⏭️  ${name}`);
      continue;
    }
    
    try {
      await test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${error.message}`);
      failed++;
      
      // If setup fails (OpenSSL missing), skip remaining tests
      if (name.includes('Setup - generate')) {
        console.log('\n  ⚠️  Skipping remaining HTTPS tests (OpenSSL not available)\n');
        skipped = true;
      }
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  // Don't fail if OpenSSL is missing (optional dependency)
  if (skipped) {
    console.log('ℹ️  HTTPS tests skipped - install OpenSSL to enable');
    process.exit(0);
  }
  
  if (failed > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

runTests();
