/**
 * CORS Middleware Tests (Zero Dependencies)
 * Tests CORS functionality with Node.js built-in assert
 */

import assert from 'assert';
import { cors, corsDevMode, corsStrict, corsMultiOrigin, corsDynamic } from '../lib/index.js';

// Test suite
const tests = {
  'Basic CORS - allows wildcard origin'() {
    const middleware = cors();
    const req = { method: 'GET', headers: { origin: 'https://example.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], '*');
  },

  'CORS - specific origin allowed'() {
    const middleware = cors({ origin: 'https://example.com' });
    const req = { method: 'GET', headers: { origin: 'https://example.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://example.com');
    assert.strictEqual(res.headers['Vary'], 'Origin');
  },

  'CORS - specific origin blocked'() {
    const middleware = cors({ origin: 'https://allowed.com' });
    const req = { method: 'GET', headers: { origin: 'https://blocked.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], undefined);
  },

  'CORS - array of origins'() {
    const middleware = cors({ 
      origin: ['https://app1.com', 'https://app2.com'] 
    });
    const req = { method: 'GET', headers: { origin: 'https://app1.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://app1.com');
  },

  'CORS - RegExp origin'() {
    const middleware = cors({ origin: /\.example\.com$/ });
    const req = { method: 'GET', headers: { origin: 'https://app.example.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://app.example.com');
  },

  'CORS - function origin validation'() {
    const middleware = cors({ 
      origin: (origin) => origin.endsWith('.trusted.com')
    });
    const req = { method: 'GET', headers: { origin: 'https://app.trusted.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://app.trusted.com');
  },

  'CORS - credentials header'() {
    const middleware = cors({ credentials: true, origin: 'https://example.com' });
    const req = { method: 'GET', headers: { origin: 'https://example.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Credentials'], 'true');
  },

  'CORS - exposed headers'() {
    const middleware = cors({ 
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'] 
    });
    const req = { method: 'GET', headers: { origin: 'https://example.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Expose-Headers'], 'X-Total-Count, X-Page-Count');
  },

  'CORS - preflight request'() {
    const middleware = cors({ 
      methods: ['GET', 'POST', 'PUT'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });
    const req = { method: 'OPTIONS', headers: { origin: 'https://example.com' } };
    const res = createMockResponse();
    
    let endCalled = false;
    res.end = () => { endCalled = true; };
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Methods'], 'GET, POST, PUT');
    assert.strictEqual(res.headers['Access-Control-Allow-Headers'], 'Content-Type, Authorization');
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(endCalled, true);
  },

  'CORS - preflight with maxAge'() {
    const middleware = cors({ maxAge: 86400 });
    const req = { method: 'OPTIONS', headers: { origin: 'https://example.com' } };
    const res = createMockResponse();
    res.end = () => {};
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Max-Age'], '86400');
  },

  'CORS - reflect request headers'() {
    const middleware = cors();
    const req = { 
      method: 'OPTIONS', 
      headers: { 
        origin: 'https://example.com',
        'access-control-request-headers': 'X-Custom-Header, Content-Type'
      } 
    };
    const res = createMockResponse();
    res.end = () => {};
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Headers'], 'X-Custom-Header, Content-Type');
  },

  'corsDevMode - allows all'() {
    const middleware = corsDevMode();
    const req = { method: 'GET', headers: { origin: 'https://any-site.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], '*');
  },

  'corsStrict - specific origin with credentials'() {
    const middleware = corsStrict('https://app.example.com');
    const req = { method: 'GET', headers: { origin: 'https://app.example.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://app.example.com');
    assert.strictEqual(res.headers['Access-Control-Allow-Credentials'], 'true');
  },

  'corsMultiOrigin - array support'() {
    const middleware = corsMultiOrigin(['https://app1.com', 'https://app2.com']);
    const req = { method: 'GET', headers: { origin: 'https://app2.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://app2.com');
  },

  'corsDynamic - function validation'() {
    const middleware = corsDynamic((origin) => origin.includes('trusted'));
    const req = { method: 'GET', headers: { origin: 'https://trusted-app.com' } };
    const res = createMockResponse();
    
    middleware(req, res, () => {});
    
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], 'https://trusted-app.com');
  }
};

// Helper function
function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end() {}
  };
}

// Test runner
function runTests() {
  console.log('🧪 Running CORS Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
