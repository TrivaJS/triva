/**
 * Redis Database Adapter Tests
 * Requires: REDIS_HOST and REDIS_PORT environment variables OR skips
 */

import assert from 'assert';
import { RedisAdapter } from '../../lib/db-adapters.js';

// Check for credentials (or use defaults)
const hasCredentials = process.env.REDIS_HOST || process.env.REDIS_URL;
const useDefaults = !hasCredentials;

if (useDefaults) {
  console.log('⚠️  No Redis credentials provided, attempting localhost:6379');
  console.log('   Set REDIS_HOST and REDIS_PORT to use different server');
  console.log('   Or set REDIS_URL=redis://localhost:6379');
}

// Check if redis package is available
let redisAvailable = true;
try {
  await import('redis');
} catch (err) {
  redisAvailable = false;
}

if (!redisAvailable) {
  console.log('⏭️  Skipping Redis tests (redis package not installed)');
  console.log('   Install with: npm install redis');
  process.exit(0);
}

let adapter;
let redisAccessible = false;

const tests = {
  async 'Redis - attempts connection'() {
    try {
      adapter = new RedisAdapter({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      });
      await adapter.connect();
      redisAccessible = true;
      assert.strictEqual(adapter.connected, true);
    } catch (error) {
      if (useDefaults) {
        console.log('   ⚠️  Redis not accessible at localhost:6379 - skipping remaining tests');
        redisAccessible = false;
      } else {
        throw error;
      }
    }
  },

  async 'Redis - set and get'() {
    if (!redisAccessible) return;
    await adapter.set('test:key', { data: 'value' });
    const value = await adapter.get('test:key');
    assert.deepStrictEqual(value, { data: 'value' });
  },

  async 'Redis - handles objects'() {
    if (!redisAccessible) return;
    const obj = { name: 'test', count: 42, nested: { value: true } };
    await adapter.set('test:object', obj);
    const result = await adapter.get('test:object');
    assert.deepStrictEqual(result, obj);
  },

  async 'Redis - returns null for non-existent keys'() {
    if (!redisAccessible) return;
    const value = await adapter.get('test:nonexistent');
    assert.strictEqual(value, null);
  },

  async 'Redis - deletes keys'() {
    if (!redisAccessible) return;
    await adapter.set('test:delete', 'value');
    const deleted = await adapter.delete('test:delete');
    assert.strictEqual(deleted, true);
    
    const value = await adapter.get('test:delete');
    assert.strictEqual(value, null);
  },

  async 'Redis - expires keys with TTL'() {
    if (!redisAccessible) return;
    await adapter.set('test:ttl', 'expires', 100);
    
    let value = await adapter.get('test:ttl');
    assert.strictEqual(value, 'expires');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    value = await adapter.get('test:ttl');
    assert.strictEqual(value, null);
  },

  async 'Redis - lists keys with pattern'() {
    if (!redisAccessible) return;
    await adapter.set('list:1', 'a');
    await adapter.set('list:2', 'b');
    await adapter.set('other:key', 'c');
    
    const keys = await adapter.keys('list:*');
    assert.ok(keys.includes('list:1'));
    assert.ok(keys.includes('list:2'));
  },

  async 'Redis - checks key existence'() {
    if (!redisAccessible) return;
    await adapter.set('test:exists', 'value');
    
    const exists = await adapter.has('test:exists');
    assert.strictEqual(exists, true);
    
    const notExists = await adapter.has('test:notexists');
    assert.strictEqual(notExists, false);
  },

  async 'Redis - clears all keys'() {
    if (!redisAccessible) return;
    await adapter.set('clear:1', 'a');
    await adapter.set('clear:2', 'b');
    
    await adapter.clear();
    
    const value = await adapter.get('clear:1');
    assert.strictEqual(value, null);
  },

  async 'Cleanup - disconnect'() {
    if (adapter && adapter.connected) {
      await adapter.disconnect();
    }
  }
};

// Test runner
async function runTests() {
  console.log('🧪 Running Redis Tests\n');
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      await test();
      if (!redisAccessible && name !== 'Redis - attempts connection' && name !== 'Cleanup - disconnect') {
        console.log(`  ⏭️  ${name} (skipped)`);
        skipped++;
      } else {
        console.log(`  ✅ ${name}`);
        passed++;
      }
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

runTests();
