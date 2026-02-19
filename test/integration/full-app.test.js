/**
 * Integration Tests — Full Application
 * Tests real HTTP endpoints using Node.js built-in http module
 * Zero dependencies
 */

import assert from 'assert';
import http   from 'http';
import { build, cache} from '../../lib/index.js';

const PORT    = 9997;
const baseUrl = `http://localhost:${PORT}`;
let server;

// ─── test helpers ────────────────────────────────────────────────────────────

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port:     PORT,
      path,
      method,
      headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─── tests ───────────────────────────────────────────────────────────────────

const tests = {
  async 'Setup - build application with class-based API'() {
    const buildInstance = new build({
      env:   'test',
      cache: { type: 'memory', retention: 60000 }
    });

    // Basic GET
    buildInstance.get('/api/test', (req, res) => {
      res.json({ message: 'test' });
    });

    // Parametric route
    buildInstance.get('/api/users/:id', (req, res) => {
      res.json({ userId: req.params.id });
    });

    // Query string
    buildInstance.get('/api/search', (req, res) => {
      res.json({ query: req.query });
    });

    // POST with JSON body
    buildInstance.post('/api/data', async (req, res) => {
      const body = await req.json();
      res.status(201).json({ received: body });
    });

    // PUT
    buildInstance.put('/api/items/:id', async (req, res) => {
      const body = await req.json();
      res.json({ updated: req.params.id, data: body });
    });

    // DELETE
    buildInstance.del('/api/items/:id', (req, res) => {
      res.json({ deleted: req.params.id });
    });

    // all() — matches any method
    buildInstance.all('/api/any', (req, res) => {
      res.json({ method: req.method, path: '/api/any' });
    });

    // route() chaining
    buildInstance.route('/api/resource')
      .get((req, res)  => res.json({ method: 'GET',  path: '/api/resource' }))
      .post((req, res) => res.json({ method: 'POST', path: '/api/resource' }));

    // Cache endpoint
    buildInstance.get('/api/cached', async (req, res) => {
      const cached = await cache.get('test:data');
      if (cached) return res.json({ source: 'cache', data: cached });
      const data = { value: 'fresh' };
      await cache.set('test:data', data, 5000);
      res.json({ source: 'database', data });
    });

    // Variadic handlers
    const logStep = (req, res, next) => { req.stepped = true; next(); };
    buildInstance.get('/api/variadic', logStep, (req, res) => {
      res.json({ stepped: req.stepped === true });
    });

    // Array handlers
    buildInstance.get('/api/array', [logStep, logStep], (req, res) => {
      res.json({ stepped: req.stepped === true });
    });

    // Redirect
    buildInstance.get('/api/old', (req, res) => {
      res.redirect('/api/test', 301);
    });

    // 404 base — leave uncovered routes for 404 check
    server = buildInstance.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 150));
  },

  async 'HTTP - GET simple route'() {
    const r = await makeRequest('GET', '/api/test');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).message, 'test');
  },

  async 'HTTP - GET parametric route'() {
    const r = await makeRequest('GET', '/api/users/42');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).userId, '42');
  },

  async 'HTTP - GET query string'() {
    const r = await makeRequest('GET', '/api/search?q=hello&page=2');
    assert.strictEqual(r.statusCode, 200);
    const body = JSON.parse(r.body);
    assert.strictEqual(body.query.q, 'hello');
    assert.strictEqual(body.query.page, '2');
  },

  async 'HTTP - POST request with JSON body'() {
    const payload = { name: 'test', value: 123 };
    const r = await makeRequest('POST', '/api/data', JSON.stringify(payload));
    assert.strictEqual(r.statusCode, 201);
    assert.deepStrictEqual(JSON.parse(r.body).received, payload);
  },

  async 'HTTP - PUT request'() {
    const payload = { title: 'updated' };
    const r = await makeRequest('PUT', '/api/items/7', JSON.stringify(payload));
    assert.strictEqual(r.statusCode, 200);
    const body = JSON.parse(r.body);
    assert.strictEqual(body.updated, '7');
    assert.deepStrictEqual(body.data, payload);
  },

  async 'HTTP - DELETE request'() {
    const r = await makeRequest('DELETE', '/api/items/5');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).deleted, '5');
  },

  async 'HTTP - all() responds to GET'() {
    const r = await makeRequest('GET', '/api/any');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).method, 'GET');
  },

  async 'HTTP - all() responds to POST'() {
    const r = await makeRequest('POST', '/api/any');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).method, 'POST');
  },

  async 'HTTP - all() responds to DELETE'() {
    const r = await makeRequest('DELETE', '/api/any');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).method, 'DELETE');
  },

  async 'HTTP - route() chain GET'() {
    const r = await makeRequest('GET', '/api/resource');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).method, 'GET');
  },

  async 'HTTP - route() chain POST'() {
    const r = await makeRequest('POST', '/api/resource');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).method, 'POST');
  },

  async 'HTTP - variadic handlers execute in order'() {
    const r = await makeRequest('GET', '/api/variadic');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).stepped, true);
  },

  async 'HTTP - array handlers execute in order'() {
    const r = await makeRequest('GET', '/api/array');
    assert.strictEqual(r.statusCode, 200);
    assert.strictEqual(JSON.parse(r.body).stepped, true);
  },

  async 'HTTP - redirect returns correct status and Location'() {
    const r = await makeRequest('GET', '/api/old');
    assert.strictEqual(r.statusCode, 301);
    assert.ok(r.headers['location'] && r.headers['location'].includes('/api/test'));
  },

  async 'HTTP - 404 for unknown route'() {
    const r = await makeRequest('GET', '/api/does-not-exist');
    assert.strictEqual(r.statusCode, 404);
  },

  async 'Caching - first request hits database'() {
    await cache.delete('test:data');
    const r = await makeRequest('GET', '/api/cached');
    assert.strictEqual(JSON.parse(r.body).source, 'database');
  },

  async 'Caching - second request hits cache'() {
    const r = await makeRequest('GET', '/api/cached');
    assert.strictEqual(JSON.parse(r.body).source, 'cache');
  },

  async 'Cleanup - close server'() {
    if (server) server.close();
  }
};

// ─── runner ──────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('🧪 Running Integration Tests\n');
  let passed = 0, failed = 0;

  for (const [name, test] of Object.entries(tests)) {
    try {
      await test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
      if (err.stack) console.error(`     ${err.stack.split('\n')[1]}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
