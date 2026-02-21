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

class MemoryAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.store = new Map();
    this.timers = new Map();
  }

  async connect() {
    this.connected = true;
    return true;
  }

  async disconnect() {
    this.store.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.connected = false;
    return true;
  }

  async get(key) {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  async set(key, value, ttl = null) {
    this.store.set(key, value);

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set TTL timer
    if (ttl) {
      const timer = setTimeout(() => {
        this.store.delete(key);
        this.timers.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    return true;
  }

  async delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.store.delete(key);
  }

  async clear() {
    const count = this.store.size;
    this.store.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    return count;
  }

  async keys(pattern = null) {
    const allKeys = Array.from(this.store.keys());

    if (!pattern) return allKeys;

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async has(key) {
    return this.store.has(key);
  }
}

export { MemoryAdapter };
