/**
 * Supabase Database Adapter Tests
 * Requires: SUPABASE_URL and SUPABASE_KEY environment variables OR skips
 */

import assert from 'assert';
import { SupabaseAdapter } from '../../lib/db-adapters.js';

// Check for credentials
const hasCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

if (!hasCredentials) {
  console.log('⏭️  Skipping Supabase tests (no credentials provided)');
  console.log('   Set SUPABASE_URL and SUPABASE_KEY environment variables to run these tests');
  console.log('   Get credentials from: https://supabase.com/dashboard');
  process.exit(0);
}

// Check if supabase package is available
let supabaseAvailable = true;
try {
  await import('@supabase/supabase-js');
} catch (err) {
  supabaseAvailable = false;
}

if (!supabaseAvailable) {
  console.log('⏭️  Skipping Supabase tests (@supabase/supabase-js package not installed)');
  console.log('   Install with: npm install @supabase/supabase-js');
  process.exit(0);
}

let adapter;

const tests = {
  async 'Supabase - connects successfully'() {
    adapter = new SupabaseAdapter({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
      tableName: 'triva_test_cache'
    });
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
    await adapter.set('test:ttl', 'expires', 100);
    
    let value = await adapter.get('test:ttl');
    assert.strictEqual(value, 'expires');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    value = await adapter.get('test:ttl');
    assert.strictEqual(value, null);
  },

  async 'Supabase - lists keys with pattern'() {
    await adapter.set('list:1', 'a');
    await adapter.set('list:2', 'b');
    await adapter.set('other:key', 'c');
    
    const keys = await adapter.keys('list:*');
    assert.ok(keys.includes('list:1'));
    assert.ok(keys.includes('list:2'));
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
