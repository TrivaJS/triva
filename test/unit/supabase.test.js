/**
 * Supabase Adapter Unit Tests
 * Requires: SUPABASE_URL and SUPABASE_KEY environment variables
 * Gracefully skips when credentials are not present
 */

import assert from 'assert';
import { SupabaseAdapter } from '../../lib/database/supabase.js';

const hasCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

if (!hasCredentials) {
  console.log('⏭️  Skipping Supabase unit tests (credentials not provided)');
  console.log('   Set SUPABASE_URL and SUPABASE_KEY to run these tests');
  process.exit(0);
}

const adapter = new SupabaseAdapter({
  url:       process.env.SUPABASE_URL,
  key:       process.env.SUPABASE_KEY,
  tableName: 'triva_cache_test'
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
    const value = await adapter.get('test:nonexistent:' + Date.now());
    assert.strictEqual(value, null);
  },

  async 'Supabase - deletes keys'() {
    await adapter.set('test:delete', 'value');
    const deleted = await adapter.delete('test:delete');
    assert.strictEqual(deleted, true);
    assert.strictEqual(await adapter.get('test:delete'), null);
  },

  async 'Supabase - expires keys with TTL'() {
    await adapter.set('test:ttl', 'expires', 100);
    assert.strictEqual(await adapter.get('test:ttl'), 'expires');

    await new Promise(resolve => setTimeout(resolve, 200));

    assert.strictEqual(await adapter.get('test:ttl'), null);
  },

  async 'Supabase - lists keys with pattern'() {
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
    assert.strictEqual(await adapter.has('test:exists'), true);
    assert.strictEqual(await adapter.has('test:notexists:' + Date.now()), false);
  },

  async 'Supabase - clears all keys'() {
    await adapter.set('clear:1', 'a');
    await adapter.set('clear:2', 'b');
    await adapter.clear();
    assert.strictEqual(await adapter.get('clear:1'), null);
    assert.strictEqual(await adapter.get('clear:2'), null);
  },

  async 'Cleanup - disconnect'() {
    await adapter.disconnect();
    assert.strictEqual(adapter.connected, false);
  }
};

async function runTests() {
  console.log('🧪 Running Supabase Unit Tests\n');
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
  process.exit(0);
}

runTests();
