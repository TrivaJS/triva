/**
 * Supabase Adapter Tests
 *
 * Note: These tests require a live Supabase instance
 * Set SUPABASE_URL and SUPABASE_KEY environment variables to run
 */

import assert from 'assert';
import { SupabaseAdapter } from '../../lib/database/supabase.js';

const hasSupabaseCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

// Skip tests if credentials not provided
if (!hasSupabaseCredentials) {
  console.log('⏭️  Skipping Supabase tests (credentials not provided)');
  console.log('   Set SUPABASE_URL and SUPABASE_KEY to run these tests');
  process.exit(0);
}

const adapter = new SupabaseAdapter({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
  tableName: 'triva_cache_test'  // Use test table
});

const tests = {
  async 'Supabase - connects successfully'() {
    await adapter.connect();
    assert.strictEqual(adapter.connected, true);
  },

  async 'Supabase - set and get'() {
    await adapter.set('test:key', { data: 'value' });
    const value = await adapter.get('test:key');
    assert.deepStrictEqual(value, { data: 'value' });
  },

  async 'Supabase - handles objects'() {
    const obj = { name: 'test', count: 42, nested: { value: true } };
    await adapter.set('test:object', obj);
    const result = await adapter.get('test:object');
    assert.deepStrictEqual(result, obj);
  },

  async 'Supabase - returns null for non-existent keys'() {
    const value = await adapter.get('test:nonexistent');
    assert.strictEqual(value, null);
  },

  async 'Supabase - deletes keys'() {
    await adapter.set('test:delete', 'value');
    const deleted = await adapter.delete('test:delete');
    assert.strictEqual(deleted, true);

    const value = await adapter.get('test:delete');
    assert.strictEqual(value, null);
  },

  async 'Supabase - expires keys with TTL'() {
    await adapter.set('test:ttl', 'expires', 100); // 100ms TTL

    let value = await adapter.get('test:ttl');
    assert.strictEqual(value, 'expires');

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 200));

    value = await adapter.get('test:ttl');
    assert.strictEqual(value, null);
  },

  async 'Supabase - lists keys'() {
    await adapter.set('list:1', 'a');
    await adapter.set('list:2', 'b');
    await adapter.set('other:key', 'c');

    const keys = await adapter.keys('list:*');
    assert.ok(keys.includes('list:1'));
    assert.ok(keys.includes('list:2'));
    assert.ok(!keys.includes('other:key'));
  },

  async 'Supabase - checks key existence'() {
    await adapter.set('test:exists', 'value');

    const exists = await adapter.has('test:exists');
    assert.strictEqual(exists, true);

    const notExists = await adapter.has('test:notexists');
    assert.strictEqual(notExists, false);
  },

  async 'Supabase - clears all keys'() {
    await adapter.set('clear:1', 'a');
    await adapter.set('clear:2', 'b');

    await adapter.clear();

    const value1 = await adapter.get('clear:1');
    const value2 = await adapter.get('clear:2');
    assert.strictEqual(value1, null);
    assert.strictEqual(value2, null);
  },

  async 'Cleanup - disconnect'() {
    await adapter.disconnect();
    assert.strictEqual(adapter.connected, false);
  }
};

// Test runner
async function runTests() {
  console.log('🧪 Running Supabase Tests\n');

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
