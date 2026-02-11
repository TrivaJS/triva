/*!
 * Triva - SQLite Database Adapter
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { DatabaseAdapter } from './base-adapter.js';

class SQLiteAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dbPath = config.filename || './triva.sqlite';
    this.db = null;
  }

  async connect() {
    try {
      // Dynamic import
      let sqlite3;
      try {
        const module = await import('sqlite3');
        sqlite3 = module.default;
      } catch (err) {
        throw new Error(
          '❌ sqlite3 package not found\n\n' +
          '   Install with: npm install sqlite3\n' +
          '   Documentation: https://www.npmjs.com/package/sqlite3\n'
        );
      }

      this.db = await new Promise((resolve, reject) => {
        const db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) reject(err);
          else resolve(db);
        });
      });

      // Create table
      await this._run(`
        CREATE TABLE IF NOT EXISTS triva_cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER
        )
      `);

      // Create index
      await this._run(`
        CREATE INDEX IF NOT EXISTS idx_expires_at 
        ON triva_cache (expires_at)
      `);

      this.connected = true;
      console.log(`✅ Connected to SQLite database at ${this.dbPath}`);
      return true;
    } catch (error) {
      console.error('❌ SQLite connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      await new Promise((resolve) => {
        this.db.close(resolve);
      });
      this.connected = false;
      console.log('✅ Disconnected from SQLite');
    }
    return true;
  }

  async get(key) {
    const row = await this._get(
      'SELECT value FROM triva_cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)',
      [key, Date.now()]
    );
    
    return row ? JSON.parse(row.value) : null;
  }

  async set(key, value, ttl = null) {
    const expiresAt = ttl ? Date.now() + ttl : null;
    
    await this._run(
      'INSERT OR REPLACE INTO triva_cache (key, value, expires_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), expiresAt]
    );
    
    return true;
  }

  async delete(key) {
    const result = await this._run('DELETE FROM triva_cache WHERE key = ?', [key]);
    return result.changes > 0;
  }

  async clear() {
    const result = await this._run('DELETE FROM triva_cache');
    return result.changes;
  }

  async keys(pattern = null) {
    let rows;
    
    if (pattern) {
      const regex = pattern.replace(/\*/g, '%');
      rows = await this._all('SELECT key FROM triva_cache WHERE key LIKE ?', [regex]);
    } else {
      rows = await this._all('SELECT key FROM triva_cache');
    }
    
    return rows.map(row => row.key);
  }

  async has(key) {
    const row = await this._get('SELECT 1 FROM triva_cache WHERE key = ? LIMIT 1', [key]);
    return !!row;
  }

  // Helper methods
  _run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  _get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  _all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

export { SQLiteAdapter };
