/*!
 * Triva - Test Suite
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { test } from 'node:test';
import assert from 'node:assert';
import { cache, configCache } from '../lib/cache.js';
import { log } from '../lib/log.js';

test('Cache - Basic Operations', async (t) => {
  await t.test('should set and get values', async () => {
    await cache.set('test-key', { data: 'value' });
    const value = await cache.get('test-key');
    assert.deepStrictEqual(value, { data: 'value' });
  });

  await t.test('should return null for non-existent keys', async () => {
    const value = await cache.get('non-existent');
    assert.strictEqual(value, null);
  });

  await t.test('should delete values', async () => {
    await cache.set('delete-me', 'value');
    await cache.delete('delete-me');
    const value = await cache.get('delete-me');
    assert.strictEqual(value, null);
  });

  await t.test('should check key existence', async () => {
    await cache.set('exists', 'yes');
    assert.strictEqual(await cache.has('exists'), true);
    assert.strictEqual(await cache.has('does-not-exist'), false);
  });
});

test('Cache - TTL and Expiration', async (t) => {
  await t.test('should expire values after TTL', async () => {
    await cache.set('expire-me', 'value', 100); // 100ms TTL
    
    // Should exist immediately
    assert.strictEqual(await cache.has('expire-me'), true);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should be expired
    assert.strictEqual(await cache.has('expire-me'), false);
    assert.strictEqual(await cache.get('expire-me'), null);
  });

  await t.test('should cleanup expired entries', async () => {
    await cache.set('cleanup-1', 'value', 50);
    await cache.set('cleanup-2', 'value', 50);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const removed = await cache.cleanup();
    assert.strictEqual(removed >= 2, true);
  });
});

test('Cache - Pattern Matching', async (t) => {
  await t.test('should list all keys', async () => {
    await cache.clear();
    await cache.set('test:1', 'a');
    await cache.set('test:2', 'b');
    await cache.set('other:1', 'c');
    
    const allKeys = await cache.keys();
    assert.strictEqual(allKeys.length, 3);
  });

  await t.test('should filter keys by pattern', async () => {
    await cache.clear();
    await cache.set('user:1', 'a');
    await cache.set('user:2', 'b');
    await cache.set('post:1', 'c');
    
    const userKeys = await cache.keys('user:.*');
    assert.strictEqual(userKeys.length, 2);
    assert.strictEqual(userKeys.every(k => k.startsWith('user:')), true);
  });
});

test('Cache - Configuration', async (t) => {
  await t.test('should configure cache settings', () => {
    configCache({
      cache_data: true,
      cache_type: 'memory',
      cache_limit: 1000,
      cache_retention: 5000
    });
    
    // Configuration should be applied
    assert.ok(cache.config);
  });

  await t.test('should get cache statistics', async () => {
    await cache.clear();
    await cache.set('stat-test', 'value');
    
    const stats = await cache.stats();
    assert.ok(stats.size >= 1);
    assert.ok(stats.config);
  });
});

test('Log - Basic Operations', async (t) => {
  await log.clear();

  await t.test('should create log entries', async () => {
    const mockReq = {
      method: 'GET',
      url: '/test?foo=bar',
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: '127.0.0.1' },
      triva: {}
    };
    
    await log.push(mockReq);
    const logs = await log.get('all');
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].method, 'GET');
  });

  await t.test('should filter logs by method', async () => {
    await log.clear();
    
    await log.push({
      method: 'GET',
      url: '/test',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    });
    
    await log.push({
      method: 'POST',
      url: '/test',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    });
    
    const getLogs = await log.get({ method: 'GET' });
    assert.strictEqual(getLogs.length, 1);
    assert.strictEqual(getLogs[0].method, 'GET');
  });

  await t.test('should limit log results', async () => {
    await log.clear();
    
    for (let i = 0; i < 10; i++) {
      await log.push({
        method: 'GET',
        url: `/test/${i}`,
        headers: {},
        socket: { remoteAddress: '127.0.0.1' }
      });
    }
    
    const limited = await log.get({ limit: 5 });
    assert.strictEqual(limited.length, 5);
  });
});

test('Log - Search and Statistics', async (t) => {
  await log.clear();

  await t.test('should search logs', async () => {
    await log.push({
      method: 'GET',
      url: '/api/users',
      headers: { 'user-agent': 'Mozilla' },
      socket: { remoteAddress: '127.0.0.1' }
    });
    
    const results = await log.search('users');
    assert.strictEqual(results.length, 1);
  });

  await t.test('should get statistics', async () => {
    await log.clear();
    
    await log.push({
      method: 'GET',
      url: '/test',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    });
    
    const stats = await log.getStats();
    assert.ok(stats.total >= 1);
    assert.ok(stats.recent);
  });
});

console.log('Running Triva test suite...');
