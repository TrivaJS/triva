/*!
 * Triva
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

/* ---------------- Cache Entry ---------------- */
class CacheEntry {
  constructor(key, value, ttl = null) {
    this.key = key;
    this.value = value;
    this.created = Date.now();
    this.ttl = ttl;
    this.accessed = Date.now();
    this.hits = 0;
  }

  isExpired() {
    if (this.ttl === null) return false;
    return Date.now() - this.created > this.ttl;
  }

  touch() {
    this.accessed = Date.now();
    this.hits++;
  }
}

/* ---------------- Cache Storage Strategies ---------------- */
class LocalCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.isExpired()) {
      this.store.delete(key);
      return null;
    }
    
    entry.touch();
    return entry.value;
  }

  async set(key, value, ttl = null) {
    const entry = new CacheEntry(key, value, ttl);
    this.store.set(key, entry);
    return true;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (entry.isExpired()) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  async clear() {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  async keys(pattern = null) {
    const keys = Array.from(this.store.keys());
    
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern);
    return keys.filter(key => regex.test(key));
  }

  async size() {
    return this.store.size;
  }

  async cleanup() {
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.isExpired()) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  async stats() {
    const entries = Array.from(this.store.values());
    const expired = entries.filter(e => e.isExpired()).length;
    
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0;
    
    return {
      size: this.store.size,
      expired,
      active: this.store.size - expired,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100
    };
  }
}

/* ---------------- Memory Cache with LRU Eviction ---------------- */
class MemoryCache {
  constructor(config = {}) {
    this.maxSize = config.limit || 100000;
    this.store = new Map();
    this.accessOrder = [];
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.isExpired()) {
      this.store.delete(key);
      this._removeFromAccessOrder(key);
      return null;
    }
    
    entry.touch();
    this._updateAccessOrder(key);
    return entry.value;
  }

  async set(key, value, ttl = null) {
    // Evict if at capacity and key is new
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this._evictLRU();
    }
    
    const entry = new CacheEntry(key, value, ttl);
    this.store.set(key, entry);
    this._updateAccessOrder(key);
    return true;
  }

  async delete(key) {
    this._removeFromAccessOrder(key);
    return this.store.delete(key);
  }

  async has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (entry.isExpired()) {
      this.store.delete(key);
      this._removeFromAccessOrder(key);
      return false;
    }
    
    return true;
  }

  async clear() {
    const size = this.store.size;
    this.store.clear();
    this.accessOrder = [];
    return size;
  }

  async keys(pattern = null) {
    const keys = Array.from(this.store.keys());
    
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern);
    return keys.filter(key => regex.test(key));
  }

  async size() {
    return this.store.size;
  }

  async cleanup() {
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.isExpired()) {
        this.store.delete(key);
        this._removeFromAccessOrder(key);
        removed++;
      }
    }
    return removed;
  }

  async stats() {
    const entries = Array.from(this.store.values());
    const expired = entries.filter(e => e.isExpired()).length;
    
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0;
    
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      expired,
      active: this.store.size - expired,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100
    };
  }

  _updateAccessOrder(key) {
    this._removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  _removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  _evictLRU() {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder.shift();
    this.store.delete(lruKey);
  }
}

/* ---------------- Cache Manager ---------------- */
class CacheManager {
  constructor() {
    this.config = {
      enabled: true,
      type: 'local',
      retention: 24 * 60 * 60 * 1000, // 24 hours
      limit: 100000,
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    };
    
    this.backend = new LocalCache();
    this.cleanupTimer = null;
    this._startCleanup();
  }

  configure(options = {}) {
    this.config = {
      ...this.config,
      enabled: options.cache_data !== false,
      type: options.cache_type || this.config.type,
      retention: options.cache_retention || this.config.retention,
      limit: options.cache_limit || this.config.limit,
      cleanupInterval: options.cleanup_interval || this.config.cleanupInterval
    };

    // Switch backend based on type
    if (this.config.type === 'memory') {
      this.backend = new MemoryCache({ limit: this.config.limit });
    } else {
      this.backend = new LocalCache();
    }

    // Restart cleanup with new interval
    this._stopCleanup();
    this._startCleanup();

    return this;
  }

  async get(key) {
    if (!this.config.enabled) return null;
    return this.backend.get(key);
  }

  async set(key, value, ttl = null) {
    if (!this.config.enabled) return false;
    
    const actualTTL = ttl !== null ? ttl : this.config.retention;
    return this.backend.set(key, value, actualTTL);
  }

  async delete(key) {
    if (!this.config.enabled) return false;
    return this.backend.delete(key);
  }

  async has(key) {
    if (!this.config.enabled) return false;
    return this.backend.has(key);
  }

  async clear() {
    return this.backend.clear();
  }

  async keys(pattern = null) {
    return this.backend.keys(pattern);
  }

  async size() {
    return this.backend.size();
  }

  async cleanup() {
    return this.backend.cleanup();
  }

  async stats() {
    const backendStats = await this.backend.stats();
    return {
      ...backendStats,
      config: {
        enabled: this.config.enabled,
        type: this.config.type,
        retention: this.config.retention,
        limit: this.config.limit
      }
    };
  }

  _startCleanup() {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(err => {
        console.error('Cache cleanup error:', err);
      });
    }, this.config.cleanupInterval);

    // Don't keep the process alive just for cleanup
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  _stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  shutdown() {
    this._stopCleanup();
  }
}

/* ---------------- Export Singleton & Factory ---------------- */
const cache = new CacheManager();

function configCache(options = {}) {
  return cache.configure(options);
}

export { cache, configCache, CacheManager };
