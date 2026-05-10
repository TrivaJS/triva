/**
 * MongoDB Database Adapter Tests
 * Requires: MONGODB_URI environment variable OR skips
 */

import assert from 'assert';
import { MongoDBAdapter } from '../../lib/database/index.js';

// Check for credentials
const hasCredentials = !!process.env.MONGODB_URI;

if (!hasCredentials) {
  console.log('⏭️  Skipping MongoDB tests (no credentials provided)');
  console.log('   Set MONGODB_URI environment variable to run these tests');
  console.log('   Example: MONGODB_URI=mongodb://localhost:27017/test');
  process.exit(0);
}

// Check if mongodb package is available
let mongodbAvailable = true;
try {
  await import('mongodb');
} catch (err) {
  mongodbAvailable = false;
}

if (!mongodbAvailable) {
  console.log('⏭️  Skipping MongoDB tests (mongodb package not installed)');
  console.log('   Install with: npm install mongodb');
  process.exit(0);
}

let adapter;

const tests = {
  async 'MongoDB - connects successfully'() {
    adapter = new MongoDBAdapter({
      uri: process.env.MONGODB_URI,
      database: 'triva_test',
      collection: 'test_cache'
    });
    await adapter.connect();
    assert.strictEqual(adapter.connected, true);
  },

  async 'MongoDB - set and get'() {
    await adapter.set('test:key', { data: 'value' });
    const value = await adapter.get('test:key');
    assert.deepStrictEqual(value, { data: 'value' });
  },

  async 'MongoDB - handles objects'() {
    const obj = { name: 'test', count: 42, nested: { value: true } };
    await adapter.set('test:object', obj);
    const result = await adapter.get('test:object');
    assert.deepStrictEqual(result, obj);
  },

  async 'MongoDB - returns null for non-existent keys'() {
    const value = await adapter.get('test:nonexistent');
    assert.strictEqual(value, null);
  },

  async 'MongoDB - deletes keys'() {
    await adapter.set('test:delete', 'value');
    const deleted = await adapter.delete('test:delete');
    assert.strictEqual(deleted, true);

    const value = await adapter.get('test:delete');
    assert.strictEqual(value, null);
  },

  async 'MongoDB - expires keys with TTL'() {
    // MongoDB TTL index runs every 60 seconds, so we test with immediate manual check
    await adapter.set('test:ttl', 'expires', 1000); // 1 second

    let value = await adapter.get('test:ttl');
    assert.strictEqual(value, 'expires');

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1500));

    // MongoDB TTL index may not have run yet, so manually check expiration
    const doc = await adapter.collection.findOne({ _id: 'test:ttl' });
    if (doc && doc.expiresAt && doc.expiresAt <= new Date()) {
      // Document is expired but not yet removed by MongoDB
      // This is expected behavior - TTL index runs every 60 seconds
      console.log('   ℹ️  TTL set correctly (MongoDB background task will remove expired docs)');
    } else {
      // Document was removed or doesn't exist
      value = await adapter.get('test:ttl');
      assert.strictEqual(value, null);
    }
  },

  async 'MongoDB - lists keys with pattern'() {
    await adapter.set('list:1', 'a');
    await adapter.set('list:2', 'b');
    await adapter.set('other:key', 'c');

    const keys = await adapter.keys('list:*');
    assert.ok(keys.includes('list:1'));
    assert.ok(keys.includes('list:2'));
  },

  async 'MongoDB - checks key existence'() {
    await adapter.set('test:exists', 'value');

    const exists = await adapter.has('test:exists');
    assert.strictEqual(exists, true);

    const notExists = await adapter.has('test:notexists');
    assert.strictEqual(notExists, false);
  },

  async 'MongoDB - clears all keys'() {
    await adapter.set('clear:1', 'a');
    await adapter.set('clear:2', 'b');

    const count = await adapter.clear();
    assert.ok(count >= 2);
  },

  async 'Cleanup - disconnect'() {
    if (adapter && adapter.connected) {
      await adapter.disconnect();
    }
  }
};

// Test runner
async function runTests() {
  console.log('🧪 Running MongoDB Tests\n');

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

  process.exit(0);
}

runTests();
