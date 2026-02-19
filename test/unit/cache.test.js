/**
 * Cache Unit Tests
 * Tests memory cache operations via the class-based build API
 * Zero dependencies — Node.js built-in assert only
 */

import assert from 'assert';
import { build, cache } from '../../lib/index.js';

const tests = {
  async 'Memory Cache - initialises via build()'() {
    const instanceBuild = new build({ cache: { type: 'memory' } });
    // If no throw, build succeeded
    instanceBuild.listen(3000);
    assert.ok(true);
  },

  async 'Memory Cache - set and get string'() {
    const instanceBuild = new build({ cache: { type: 'memory' } });
    instanceBuild.listen(3000);
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

  async 'Memory Cache - returns null for non-existent key'() {
    const result = await cache.get('test:nonexistent:' + Date.now());
    assert.strictEqual(result, null);
  },

  async 'Memory Cache - deletes keys'() {
    const key = 'test:delete:' + Date.now();
    await cache.set(key, 'value');
    await cache.delete(key);
    assert.strictEqual(await cache.get(key), null);
  },

  async 'Memory Cache - expires keys with TTL'() {
    const key = 'test:ttl:' + Date.now();
    await cache.set(key, 'expires', 300); // 300ms

    assert.strictEqual(await cache.get(key), 'expires');

    await new Promise(resolve => setTimeout(resolve, 400));

    assert.strictEqual(await cache.get(key), null);
  },

  async 'Memory Cache - handles pattern deletion'() {
    const ts = Date.now();
    await cache.set(`users:${ts}:1`, 'user1');
    await cache.set(`users:${ts}:2`, 'user2');
    await cache.set(`products:${ts}:1`, 'product1');

    await cache.delete(`users:${ts}:*`);

    assert.strictEqual(await cache.get(`users:${ts}:1`), null);
    assert.strictEqual(await cache.get(`users:${ts}:2`), null);
    assert.strictEqual(await cache.get(`products:${ts}:1`), 'product1');
  },

  async 'Cache Edge Cases - null values'() {
    const key = 'test:null:' + Date.now();
    await cache.set(key, null);
    assert.strictEqual(await cache.get(key), null);
  },

  async 'Cache Edge Cases - empty strings'() {
    const key = 'test:empty:' + Date.now();
    await cache.set(key, '');
    assert.strictEqual(await cache.get(key), '');
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
  },

  async 'Cache - has() returns true for existing key'() {
    const key = 'test:has:' + Date.now();
    await cache.set(key, 'present');
    const exists = await cache.has(key);
    assert.strictEqual(exists, true);
  },

  async 'Cache - has() returns false for missing key'() {
    const key = 'test:has:missing:' + Date.now();
    const exists = await cache.has(key);
    assert.strictEqual(exists, false);
  },

  async 'Cache - clear() removes all entries'() {
    await cache.set('clear:a', '1');
    await cache.set('clear:b', '2');
    await cache.clear();
    assert.strictEqual(await cache.get('clear:a'), null);
    assert.strictEqual(await cache.get('clear:b'), null);
  },

  async 'Cache - stats() returns object with size'() {
    const instanceBuild = new build({ cache: { type: 'memory' } });
    await cache.set('stats:test', 'value');
    const stats = await cache.stats();
    assert.ok(stats !== null && typeof stats === 'object');
    assert.ok('size' in stats || 'entries' in stats || typeof stats.size === 'number');
  }
};

async function runTests() {
  console.log('🧪 Running Cache Tests\n');
  let passed = 0, failed = 0;

  for (const [name, test] of Object.entries(tests)) {
    try {
      await test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) process.exit(1);
  console.log('🎉 All tests passed!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
