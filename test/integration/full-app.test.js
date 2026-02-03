/**
 * Integration Tests (Zero Dependencies)
 * Uses only Node.js built-in modules
 */

import assert from 'assert';
import http from 'http';
import { build, get, post, listen, cache } from '../../lib/index.js';

const port = 9999;
const baseUrl = `http://localhost:${port}`;
let server;

// Test suite
const tests = {
  async 'Setup - build application'() {
    await build({
      env: 'test',
      cache: {
        type: 'memory',
        retention: 60000
      },
      throttle: {
        limit: 1000,
        window_ms: 60000
      }
    });

    // Set up test routes
    get('/api/test', (req, res) => {
      res.json({ message: 'test' });
    });

    get('/api/cached', async (req, res) => {
      const cached = await cache.get('test:data');
      if (cached) {
        return res.json({ source: 'cache', data: cached });
      }
      
      const data = { value: 'fresh' };
      await cache.set('test:data', data, 5000);
      res.json({ source: 'database', data });
    });

    post('/api/data', async (req, res) => {
      const body = await req.json();
      res.status(201).json({ received: body });
    });

    server = listen(port);
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  async 'HTTP - GET request works'() {
    const response = await makeRequest('GET', '/api/test');
    assert.strictEqual(response.statusCode, 200);
    
    const data = JSON.parse(response.body);
    assert.strictEqual(data.message, 'test');
  },

  async 'HTTP - POST request works'() {
    const payload = { name: 'test', value: 123 };
    const response = await makeRequest('POST', '/api/data', JSON.stringify(payload));
    
    assert.strictEqual(response.statusCode, 201);
    const data = JSON.parse(response.body);
    assert.deepStrictEqual(data.received, payload);
  },

  async 'Caching - first request hits database'() {
    // Clear cache first
    await cache.delete('test:data');
    
    const response = await makeRequest('GET', '/api/cached');
    const data = JSON.parse(response.body);
    
    assert.strictEqual(data.source, 'database');
  },

  async 'Caching - second request hits cache'() {
    const response = await makeRequest('GET', '/api/cached');
    const data = JSON.parse(response.body);
    
    assert.strictEqual(data.source, 'cache');
  },

  async 'Cleanup - close server'() {
    if (server) {
      server.close();
    }
  }
};

// Helper function
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        body: data 
      }));
    });

    req.on('error', reject);
    
    if (body) req.write(body);
    req.end();
  });
}

// Simple test runner
async function runTests() {
  console.log('🧪 Running Integration Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      await test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${error.message}`);
      if (error.stack) {
        console.error(`     ${error.stack.split('\n')[1]}`);
      }
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
