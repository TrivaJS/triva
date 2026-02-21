/*
 * Copyright 2026 Kris Powers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */


'use strict';

import { DatabaseAdapter } from './base-adapter.js';

class RedisAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
  }

  async connect() {
    try {
      // Dynamic import of redis
      const redis = await import('redis').catch(() => {
        throw new Error(
          '❌ Redis package not found.\n\n' +
          '   Install it with: npm install redis\n\n' +
          '   Then restart your server.'
        );
      });

      this.client = redis.createClient(this.config);

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });

      await this.client.connect();
      this.connected = true;
      console.log('✅ Connected to Redis');
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      console.log('✅ Disconnected from Redis');
    }
    return true;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl = null) {
    const serialized = JSON.stringify(value);

    if (ttl) {
      // Convert milliseconds to seconds, ensure at least 1 second
      const seconds = Math.max(1, Math.ceil(ttl / 1000));
      await this.client.setEx(key, seconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }

    return true;
  }

  async delete(key) {
    const result = await this.client.del(key);
    return result > 0;
  }

  async clear() {
    await this.client.flushDb();
    return 0; // Redis doesn't return count
  }

  async keys(pattern = null) {
    const searchPattern = pattern ? pattern : '*';
    return await this.client.keys(searchPattern);
  }

  async has(key) {
    const exists = await this.client.exists(key);
    return exists === 1;
  }
}

export { RedisAdapter };
