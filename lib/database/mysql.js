/*!
 * Triva - MySQL Database Adapter
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { DatabaseAdapter } from './base-adapter.js';

class MySQLAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  async connect() {
    try {
      // Dynamic import of mysql2
      const mysql = await import('mysql2/promise').catch(() => {
        throw new Error(
          '❌ MySQL package not found.\n\n' +
          '   Install it with: npm install mysql2\n\n' +
          '   Then restart your server.'
        );
      });

      this.pool = mysql.createPool(this.config);

      // Create table if not exists
      const tableName = this.config.tableName || 'triva_cache';
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          \`key\` VARCHAR(255) PRIMARY KEY,
          \`value\` JSON NOT NULL,
          \`expires_at\` TIMESTAMP NULL,
          INDEX idx_expires_at (expires_at)
        )
      `);

      this.connected = true;
      console.log('✅ Connected to MySQL');
      return true;
    } catch (error) {
      console.error('❌ MySQL connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      console.log('✅ Disconnected from MySQL');
    }
    return true;
  }

  async get(key) {
    const tableName = this.config.tableName || 'triva_cache';
    const [rows] = await this.pool.query(
      `SELECT value FROM ${tableName} 
       WHERE \`key\` = ? 
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [key]
    );

    return rows.length > 0 ? rows[0].value : null;
  }

  async set(key, value, ttl = null) {
    const tableName = this.config.tableName || 'triva_cache';
    const expiresAt = ttl ? new Date(Date.now() + ttl) : null;

    await this.pool.query(
      `INSERT INTO ${tableName} (\`key\`, value, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = ?, expires_at = ?`,
      [key, value, expiresAt, value, expiresAt]
    );

    return true;
  }

  async delete(key) {
    const tableName = this.config.tableName || 'triva_cache';
    const [result] = await this.pool.query(
      `DELETE FROM ${tableName} WHERE \`key\` = ?`,
      [key]
    );
    return result.affectedRows > 0;
  }

  async clear() {
    const tableName = this.config.tableName || 'triva_cache';
    const [result] = await this.pool.query(`DELETE FROM ${tableName}`);
    return result.affectedRows;
  }

  async keys(pattern = null) {
    const tableName = this.config.tableName || 'triva_cache';
    const query = pattern
      ? `SELECT \`key\` FROM ${tableName} WHERE \`key\` REGEXP ?`
      : `SELECT \`key\` FROM ${tableName}`;
    
    const params = pattern ? [pattern.replace(/\*/g, '.*')] : [];
    const [rows] = await this.pool.query(query, params);
    
    return rows.map(row => row.key);
  }

  async has(key) {
    const tableName = this.config.tableName || 'triva_cache';
    const [rows] = await this.pool.query(
      `SELECT 1 FROM ${tableName} WHERE \`key\` = ? LIMIT 1`,
      [key]
    );
    return rows.length > 0;
  }
}

export { MySQLAdapter };
