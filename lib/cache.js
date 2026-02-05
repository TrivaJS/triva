/*!
 * Triva - Cache Manager with Database Adapters
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { createAdapter } from './db-adapters.js';

/* ---------------- Cache Manager ---------------- */
class CacheManager {
  constructor() {
    this.adapter = null;
    this.config = {
      enabled: true,
      type: 'memory',
      retention: 10 * 60 * 1000, // 10 minutes default
      limit: 100000
    };
  }

  async configure(options = {}) {
    this.config = {
      ...this.config,
      enabled: options.cache_data !== false,
      type: options.cache_type || options.type || 'memory',
      retention: options.cache_retention || options.retention || this.config.retention,
      limit: options.cache_limit || options.limit || this.config.limit
    };

    // Create adapter
    try {
      const adapterConfig = options.database || options.db || {};
      this.adapter = createAdapter(this.config.type, adapterConfig);
      await this.adapter.connect();
    } catch (error) {
      console.error('❌ Cache adapter error:', error.message);
      throw error;
    }

    return this;
  }

  async get(key) {
    if (!this.config.enabled || !this.adapter) return null;
    return await this.adapter.get(key);
  }

  async set(key, value, ttl = null) {
    if (!this.config.enabled || !this.adapter) return false;
    const actualTtl = ttl !== null ? ttl : this.config.retention;
    return await this.adapter.set(key, value, actualTtl);
  }

  async delete(key) {
    if (!this.adapter) return false;
    
    // Check if pattern (contains wildcard)
    if (key.includes('*')) {
      const keys = await this.adapter.keys(key.replace(/\*/g, '.*'));
      let deleted = 0;
      for (const k of keys) {
        if (await this.adapter.delete(k)) {
          deleted++;
        }
      }
      return deleted;
    }
    
    return await this.adapter.delete(key);
  }

  async has(key) {
    if (!this.adapter) return false;
    return await this.adapter.has(key);
  }

  async clear() {
    if (!this.adapter) return 0;
    return await this.adapter.clear();
  }

  async keys(pattern = null) {
    if (!this.adapter) return [];
    return await this.adapter.keys(pattern);
  }

  async list(pattern = null) {
    // Alias for keys() method for CLI compatibility
    return await this.keys(pattern);
  }

  async size() {
    if (!this.adapter) return 0;
    const allKeys = await this.adapter.keys();
    return allKeys.length;
  }

  async stats() {
    const size = await this.size();
    
    return {
      size,
      maxSize: this.config.limit,
      active: size,
      config: {
        enabled: this.config.enabled,
        type: this.config.type,
        retention: this.config.retention,
        limit: this.config.limit
      }
    };
  }

  shutdown() {
    if (this.adapter) {
      this.adapter.disconnect();
    }
  }
}

/* ---------------- Export Singleton ---------------- */
const cache = new CacheManager();

function configCache(options) {
  return cache.configure(options);
}

export { cache, configCache, CacheManager };
