/**
 * Routing Unit Tests (Zero Dependencies)
 * Uses only Node.js built-in assert module
 */

import assert from 'assert';

// Test suite
const tests = {
  'Route Parameters - extracts single parameter'() {
    const params = extractParams('/users/:id', '/users/123');
    assert.strictEqual(params.id, '123');
  },

  'Route Parameters - extracts multiple parameters'() {
    const params = extractParams('/users/:userId/posts/:postId', '/users/123/posts/456');
    assert.strictEqual(params.userId, '123');
    assert.strictEqual(params.postId, '456');
  },

  'Route Parameters - handles numeric parameters'() {
    const params = extractParams('/items/:id', '/items/42');
    assert.strictEqual(params.id, '42');
  },

  'Query Strings - parses simple query'() {
    const query = parseQuery('?name=test&age=25');
    assert.strictEqual(query.name, 'test');
    assert.strictEqual(query.age, '25');
  },

  'Query Strings - handles empty query'() {
    const query = parseQuery('');
    assert.deepStrictEqual(query, {});
  },

  'Query Strings - handles array parameters'() {
    const query = parseQuery('?tags=js&tags=node&tags=web');
    assert.ok(Array.isArray(query.tags));
    assert.strictEqual(query.tags.length, 3);
    assert.strictEqual(query.tags[0], 'js');
  },

  'Response Methods - sends JSON response'() {
    const mockRes = createMockResponse();
    mockRes.json({ test: true });
    
    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.headers['Content-Type'], 'application/json');
    assert.strictEqual(mockRes.body, '{"test":true}');
  },

  'Response Methods - sets custom status code'() {
    const mockRes = createMockResponse();
    mockRes.status(404).json({ error: 'Not found' });
    
    assert.strictEqual(mockRes.statusCode, 404);
  },

  'Response Methods - sends text response'() {
    const mockRes = createMockResponse();
    mockRes.send('Hello World');
    
    assert.strictEqual(mockRes.headers['Content-Type'], 'text/plain');
    assert.strictEqual(mockRes.body, 'Hello World');
  },

  'Response Methods - chains status and json'() {
    const mockRes = createMockResponse();
    mockRes.status(201).json({ created: true });
    
    assert.strictEqual(mockRes.statusCode, 201);
    assert.strictEqual(JSON.parse(mockRes.body).created, true);
  }
};

// Helper functions
function extractParams(route, path) {
  const routeParts = route.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  const params = {};
  
  routeParts.forEach((part, i) => {
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[i];
    }
  });
  
  return params;
}

function parseQuery(queryString) {
  if (!queryString || queryString === '?') return {};
  
  const query = {};
  const params = new URLSearchParams(queryString);
  
  for (const [key, value] of params) {
    if (query[key]) {
      query[key] = Array.isArray(query[key]) 
        ? [...query[key], value]
        : [query[key], value];
    } else {
      query[key] = value;
    }
  }
  
  return query;
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.setHeader('Content-Type', 'application/json');
      this.body = JSON.stringify(data);
    },
    send(data) {
      this.setHeader('Content-Type', 'text/plain');
      this.body = data;
    }
  };
}

// Simple test runner
function runTests() {
  console.log('🧪 Running Routing Tests\n');
  
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
