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

class BetterSQLite3Adapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dbPath = config.filename || './triva.db';
    this.db = null;
  }

  async connect() {
    try {
      // Dynamic import
      let Database;
      try {
        const module = await import('better-sqlite3');
        Database = module.default;
      } catch (err) {
        throw new Error(
          '❌ better-sqlite3 package not found\n\n' +
          '   Install with: npm install better-sqlite3\n' +
          '   Documentation: https://www.npmjs.com/package/better-sqlite3\n'
        );
      }

      this.db = new Database(this.dbPath);

      // Create table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS triva_cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER
        )
      `);

      // Create index
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_expires_at
        ON triva_cache (expires_at)
      `);

      this.connected = true;
      console.log(`✅ Connected to Better-SQLite3 database at ${this.dbPath}`);
      return true;
    } catch (error) {
      console.error('❌ Better-SQLite3 connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      this.db.close();
      this.connected = false;
      console.log('✅ Disconnected from Better-SQLite3');
    }
    return true;
  }

  async get(key) {
    const stmt = this.db.prepare(
      'SELECT value FROM triva_cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)'
    );
    const row = stmt.get(key, Date.now());

    return row ? JSON.parse(row.value) : null;
  }

  async set(key, value, ttl = null) {
    const expiresAt = ttl ? Date.now() + ttl : null;

    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO triva_cache (key, value, expires_at) VALUES (?, ?, ?)'
    );
    stmt.run(key, JSON.stringify(value), expiresAt);

    return true;
  }

  async delete(key) {
    const stmt = this.db.prepare('DELETE FROM triva_cache WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  async clear() {
    const stmt = this.db.prepare('DELETE FROM triva_cache');
    const result = stmt.run();
    return result.changes;
  }

  async keys(pattern = null) {
    let stmt;
    let rows;

    if (pattern) {
      const regex = pattern.replace(/\*/g, '%');
      stmt = this.db.prepare('SELECT key FROM triva_cache WHERE key LIKE ?');
      rows = stmt.all(regex);
    } else {
      stmt = this.db.prepare('SELECT key FROM triva_cache');
      rows = stmt.all();
    }

    return rows.map(row => row.key);
  }

  async has(key) {
    const stmt = this.db.prepare('SELECT 1 FROM triva_cache WHERE key = ? LIMIT 1');
    const row = stmt.get(key);
    return !!row;
  }
}

export { BetterSQLite3Adapter };
