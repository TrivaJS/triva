/**
 * SQLite Database Adapter Tests
 */

import assert from 'assert';
import { SQLiteAdapter } from '../../lib/database/sqlite.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Check if sqlite3 is available
let sqlite3Available = true;
try {
  await import('sqlite3');
} catch (err) {
  sqlite3Available = false;
}

if (!sqlite3Available) {
  console.log('⏭️  Skipping SQLite tests (sqlite3 package not installed)');
  console.log('   Install with: npm install sqlite3');
  process.exit(0);
}

const testDir = path.join(os.tmpdir(), `triva-test-sqlite-${Date.now()}`);
const testDbPath = path.join(testDir, 'test.sqlite');
let adapter;

const tests = {
  async 'Setup - create test directory'() {
    await fs.mkdir(testDir, { recursive: true });
  },

  async 'SQLite - connects successfully'() {
    adapter = new SQLiteAdapter({ filename: testDbPath });
    await adapter.connect();
    assert.strictEqual(adapter.connected, true);
  },

  async 'SQLite - set and get'() {
    await adapter.set('test:key', { data: 'value' });
    const value = await adapter.get('test:key');
    assert.deepStrictEqual(value, { data: 'value' });
  },

  async 'SQLite - handles objects'() {
    const obj = { name: 'test', count: 42, nested: { value: true } };
    await adapter.set('test:object', obj);
    const result = await adapter.get('test:object');
    assert.deepStrictEqual(result, obj);
  },

  async 'SQLite - returns null for non-existent keys'() {
    const value = await adapter.get('test:nonexistent');
    assert.strictEqual(value, null);
  },

  async 'SQLite - deletes keys'() {
    await adapter.set('test:delete', 'value');
    const deleted = await adapter.delete('test:delete');
    assert.strictEqual(deleted, true);

    const value = await adapter.get('test:delete');
    assert.strictEqual(value, null);
  },

  async 'SQLite - expires keys with TTL'() {
    await adapter.set('test:ttl', 'expires', 100);

    let value = await adapter.get('test:ttl');
    assert.strictEqual(value, 'expires');

    await new Promise(resolve => setTimeout(resolve, 150));

    value = await adapter.get('test:ttl');
    assert.strictEqual(value, null);
  },

  async 'SQLite - lists keys with pattern'() {
    await adapter.set('list:1', 'a');
    await adapter.set('list:2', 'b');
    await adapter.set('other:key', 'c');

    const keys = await adapter.keys('list:*');
    assert.ok(keys.includes('list:1'));
    assert.ok(keys.includes('list:2'));
  },

  async 'SQLite - checks key existence'() {
    await adapter.set('test:exists', 'value');

    const exists = await adapter.has('test:exists');
    assert.strictEqual(exists, true);

    const notExists = await adapter.has('test:notexists');
    assert.strictEqual(notExists, false);
  },

  async 'SQLite - clears all keys'() {
    await adapter.set('clear:1', 'a');
    await adapter.set('clear:2', 'b');

    const count = await adapter.clear();
    assert.ok(count >= 2);
  },

  async 'SQLite - persists across reconnections'() {
    await adapter.set('persist:test', { data: 'persisted' });
    await adapter.disconnect();

    adapter = new SQLiteAdapter({ filename: testDbPath });
    await adapter.connect();

    const value = await adapter.get('persist:test');
    assert.deepStrictEqual(value, { data: 'persisted' });
  },

  async 'Cleanup - disconnect and remove files'() {
    if (adapter && adapter.connected) {
      await adapter.disconnect();
    }
    await fs.rm(testDir, { recursive: true, force: true });
  }
};

// Test runner
async function runTests() {
  console.log('🧪 Running SQLite Tests\n');

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
