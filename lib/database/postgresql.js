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

class PostgreSQLAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  async connect() {
    try {
      // Dynamic import of pg
      const pg = await import('pg').catch(() => {
        throw new Error(
          '❌ PostgreSQL package not found.\n\n' +
          '   Install it with: npm install pg\n\n' +
          '   Then restart your server.'
        );
      });

      this.pool = new pg.Pool(this.config);

      // Create table if not exists
      const tableName = this.config.tableName || 'triva_cache';
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          expires_at TIMESTAMP
        )
      `);

      // Create index for expiration
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_expires_at
        ON ${tableName} (expires_at)
      `);

      this.connected = true;
      console.log('✅ Connected to PostgreSQL');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      console.log('✅ Disconnected from PostgreSQL');
    }
    return true;
  }

  async get(key) {
    const tableName = this.config.tableName || 'triva_cache';
    const result = await this.pool.query(
      `SELECT value FROM ${tableName}
       WHERE key = $1
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [key]
    );

    return result.rows.length > 0 ? result.rows[0].value : null;
  }

  async set(key, value, ttl = null) {
    const tableName = this.config.tableName || 'triva_cache';
    const expiresAt = ttl ? new Date(Date.now() + ttl) : null;

    await this.pool.query(
      `INSERT INTO ${tableName} (key, value, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (key)
       DO UPDATE SET value = $2, expires_at = $3`,
      [key, value, expiresAt]
    );

    return true;
  }

  async delete(key) {
    const tableName = this.config.tableName || 'triva_cache';
    const result = await this.pool.query(
      `DELETE FROM ${tableName} WHERE key = $1`,
      [key]
    );
    return result.rowCount > 0;
  }

  async clear() {
    const tableName = this.config.tableName || 'triva_cache';
    const result = await this.pool.query(`DELETE FROM ${tableName}`);
    return result.rowCount;
  }

  async keys(pattern = null) {
    const tableName = this.config.tableName || 'triva_cache';
    const query = pattern
      ? `SELECT key FROM ${tableName} WHERE key ~ $1`
      : `SELECT key FROM ${tableName}`;

    const params = pattern ? [pattern.replace(/\*/g, '.*')] : [];
    const result = await this.pool.query(query, params);

    return result.rows.map(row => row.key);
  }

  async has(key) {
    const tableName = this.config.tableName || 'triva_cache';
    const result = await this.pool.query(
      `SELECT 1 FROM ${tableName} WHERE key = $1 LIMIT 1`,
      [key]
    );
    return result.rows.length > 0;
  }
}

export { PostgreSQLAdapter };
