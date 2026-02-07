/**
 * Cache Unit Tests (Zero Dependencies)
 * Uses only Node.js built-in assert module
 */

import assert from 'assert';
import { build, cache } from '../../lib/index.js';

// Test suite
const tests = {
  async 'Memory Cache - set and get'() {
    await build({ cache: { type: 'memory' } });

    await cache.set('test:key1', 'value1');
    const result = await cache.get('test:key1');

    assert.strictEqual(result, 'value1');
  },

  async 'Memory Cache - handles objects'() {
    const obj = { name: 'test', count: 42 };
    await cache.set('test:obj', obj);
    const result = await cache.get('test:obj');

    assert.deepStrictEqual(result, obj);
  },

  async 'Memory Cache - returns null for non-existent keys'() {
    const result = await cache.get('test:nonexistent:' + Date.now());
    assert.strictEqual(result, null);
  },

  async 'Memory Cache - deletes keys'() {
    const key = 'test:delete:' + Date.now();
    await cache.set(key, 'value');
    await cache.delete(key);
    const result = await cache.get(key);

    assert.strictEqual(result, null);
  },

  async 'Memory Cache - expires keys with TTL'() {
    const key = 'test:ttl:' + Date.now();
    await cache.set(key, 'expires', 300); // 300ms TTL

    // Should exist immediately
    let result = await cache.get(key);
    assert.strictEqual(result, 'expires');

    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 400));

    // Should be gone
    result = await cache.get(key);
    assert.strictEqual(result, null);
  },

  async 'Memory Cache - handles pattern deletion'() {
    const timestamp = Date.now();
    await cache.set(`users:${timestamp}:1`, 'user1');
    await cache.set(`users:${timestamp}:2`, 'user2');
    await cache.set(`products:${timestamp}:1`, 'product1');

    await cache.delete(`users:${timestamp}:*`);

    assert.strictEqual(await cache.get(`users:${timestamp}:1`), null);
    assert.strictEqual(await cache.get(`users:${timestamp}:2`), null);
    assert.strictEqual(await cache.get(`products:${timestamp}:1`), 'product1');
  },

  async 'Cache Edge Cases - null values'() {
    const key = 'test:null:' + Date.now();
    await cache.set(key, null);
    const result = await cache.get(key);

    assert.strictEqual(result, null);
  },

  async 'Cache Edge Cases - empty strings'() {
    const key = 'test:empty:' + Date.now();
    await cache.set(key, '');
    const result = await cache.get(key);

    assert.strictEqual(result, '');
  },

  async 'Cache Edge Cases - large objects'() {
    const largeObj = {
      items: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `item-${i}` }))
    };

    const key = 'test:large:' + Date.now();
    await cache.set(key, largeObj);
    const result = await cache.get(key);

    assert.strictEqual(result.items.length, 1000);
    assert.strictEqual(result.items[500].id, 500);
  }
};

// Simple test runner
async function runTests() {
  console.log('🧪 Running Cache Tests\n');

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
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }

  console.log('🎉 All tests passed!\n');
  process.exit(0);

}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
