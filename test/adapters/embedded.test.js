/**
 * Embedded Database Adapter Tests
 */

import assert from 'assert';
import { EmbeddedAdapter } from '../../lib/database/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const testDir = path.join(os.tmpdir(), `triva-test-${Date.now()}`);
const testDbPath = path.join(testDir, 'test.db');
const testDbEncryptedPath = path.join(testDir, 'test-encrypted.db');

let adapter;
let encryptedAdapter;

const tests = {
  async 'Setup - create test directory'() {
    await fs.mkdir(testDir, { recursive: true });
  },

  async 'Embedded - connects successfully'() {
    adapter = new EmbeddedAdapter({
      filename: testDbPath
    });
    await adapter.connect();
    assert.strictEqual(adapter.connected, true);
  },

  async 'Embedded - set and get'() {
    await adapter.set('test:key', { data: 'value' });
    const value = await adapter.get('test:key');
    assert.deepStrictEqual(value, { data: 'value' });
  },

  async 'Embedded - handles objects'() {
    const obj = { name: 'test', count: 42, nested: { value: true } };
    await adapter.set('test:object', obj);
    const result = await adapter.get('test:object');
    assert.deepStrictEqual(result, obj);
  },

  async 'Embedded - returns null for non-existent keys'() {
    const value = await adapter.get('test:nonexistent');
    assert.strictEqual(value, null);
  },

  async 'Embedded - deletes keys'() {
    await adapter.set('test:delete', 'value');
    const deleted = await adapter.delete('test:delete');
    assert.strictEqual(deleted, true);

    const value = await adapter.get('test:delete');
    assert.strictEqual(value, null);
  },

  async 'Embedded - expires keys with TTL'() {
    await adapter.set('test:ttl', 'expires', 100);

    let value = await adapter.get('test:ttl');
    assert.strictEqual(value, 'expires');

    await new Promise(resolve => setTimeout(resolve, 150));

    value = await adapter.get('test:ttl');
    assert.strictEqual(value, null);
  },

  async 'Embedded - lists keys with pattern'() {
    await adapter.set('list:1', 'a');
    await adapter.set('list:2', 'b');
    await adapter.set('other:key', 'c');

    const keys = await adapter.keys('list:*');
    assert.ok(keys.includes('list:1'));
    assert.ok(keys.includes('list:2'));
    assert.ok(!keys.includes('other:key'));
  },

  async 'Embedded - checks key existence'() {
    await adapter.set('test:exists', 'value');

    const exists = await adapter.has('test:exists');
    assert.strictEqual(exists, true);

    const notExists = await adapter.has('test:notexists');
    assert.strictEqual(notExists, false);
  },

  async 'Embedded - clears all keys'() {
    await adapter.set('clear:1', 'a');
    await adapter.set('clear:2', 'b');

    const count = await adapter.clear();
    assert.ok(count >= 2);

    const value = await adapter.get('clear:1');
    assert.strictEqual(value, null);
  },

  async 'Embedded - persists data to file'() {
    await adapter.set('persist:test', 'data');
    await adapter.disconnect();

    const fileExists = await fs.access(testDbPath).then(() => true).catch(() => false);
    assert.strictEqual(fileExists, true);
  },

  async 'Embedded - loads persisted data'() {
    adapter = new EmbeddedAdapter({ filename: testDbPath });
    await adapter.connect();

    const value = await adapter.get('persist:test');
    assert.strictEqual(value, 'data');
  },

  async 'Embedded Encryption - connects with encryption key'() {
    encryptedAdapter = new EmbeddedAdapter({
      filename: testDbEncryptedPath,
      encryptionKey: 'test-secret-key-for-testing-only'
    });
    await encryptedAdapter.connect();
    assert.strictEqual(encryptedAdapter.connected, true);
  },

  async 'Embedded Encryption - encrypts data'() {
    await encryptedAdapter.set('encrypted:key', { secret: 'data' });
    await encryptedAdapter.disconnect();

    // Read file directly - should be encrypted (not readable JSON)
    const fileContent = await fs.readFile(testDbEncryptedPath, 'utf8');
    assert.ok(!fileContent.includes('secret'));
    assert.ok(!fileContent.includes('data'));
  },

  async 'Embedded Encryption - decrypts data correctly'() {
    encryptedAdapter = new EmbeddedAdapter({
      filename: testDbEncryptedPath,
      encryptionKey: 'test-secret-key-for-testing-only'
    });
    await encryptedAdapter.connect();

    const value = await encryptedAdapter.get('encrypted:key');
    assert.deepStrictEqual(value, { secret: 'data' });
  },

  async 'Embedded Encryption - fails with wrong key'() {
    const wrongKeyAdapter = new EmbeddedAdapter({
      filename: testDbEncryptedPath,
      encryptionKey: 'wrong-key'
    });

    try {
      await wrongKeyAdapter.connect();
      await wrongKeyAdapter.get('encrypted:key');
      assert.fail('Should have thrown decryption error');
    } catch (error) {
      assert.ok(error.message.includes('error') || error.message.includes('decrypt'));
    }
  },

  async 'Cleanup - disconnect and remove files'() {
    if (adapter && adapter.connected) {
      await adapter.disconnect();
    }
    if (encryptedAdapter && encryptedAdapter.connected) {
      await encryptedAdapter.disconnect();
    }

    await fs.rm(testDir, { recursive: true, force: true });
  }
};

// Test runner
async function runTests() {
  console.log('🧪 Running Embedded Database Tests\n');

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
