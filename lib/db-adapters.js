/*!
 * Triva - Database Adapters
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

/* ---------------- Base Adapter Interface ---------------- */
class DatabaseAdapter {
  constructor(config) {
    this.config = config;
    this.connected = false;
  }

  async connect() {
    throw new Error('connect() must be implemented');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented');
  }

  async get(key) {
    throw new Error('get() must be implemented');
  }

  async set(key, value, ttl = null) {
    throw new Error('set() must be implemented');
  }

  async delete(key) {
    throw new Error('delete() must be implemented');
  }

  async clear() {
    throw new Error('clear() must be implemented');
  }

  async keys(pattern = null) {
    throw new Error('keys() must be implemented');
  }

  async has(key) {
    throw new Error('has() must be implemented');
  }
}

/* ---------------- Memory Adapter (Built-in) ---------------- */
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
    return this.store.get(key) || null;
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

/* ---------------- MongoDB Adapter ---------------- */
class MongoDBAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      // Dynamic import of mongodb
      const { MongoClient } = await import('mongodb').catch(() => {
        throw new Error(
          '❌ MongoDB package not found.\n\n' +
          '   Install it with: npm install mongodb\n\n' +
          '   Then restart your server.'
        );
      });

      const uri = this.config.uri || this.config.url;
      if (!uri) {
        throw new Error('MongoDB URI is required in config');
      }

      this.client = new MongoClient(uri, this.config.options || {});
      await this.client.connect();

      const dbName = this.config.database || 'triva';
      this.db = this.client.db(dbName);
      this.collection = this.db.collection(this.config.collection || 'cache');

      // Create TTL index for automatic expiration
      await this.collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );

      this.connected = true;
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('✅ Disconnected from MongoDB');
    }
    return true;
  }

  async get(key) {
    const doc = await this.collection.findOne({ _id: key });
    return doc ? doc.value : null;
  }

  async set(key, value, ttl = null) {
    const doc = {
      _id: key,
      value,
      createdAt: new Date()
    };

    if (ttl) {
      doc.expiresAt = new Date(Date.now() + ttl);
    }

    await this.collection.replaceOne(
      { _id: key },
      doc,
      { upsert: true }
    );

    return true;
  }

  async delete(key) {
    const result = await this.collection.deleteOne({ _id: key });
    return result.deletedCount > 0;
  }

  async clear() {
    const result = await this.collection.deleteMany({});
    return result.deletedCount;
  }

  async keys(pattern = null) {
    const query = pattern 
      ? { _id: { $regex: pattern.replace(/\*/g, '.*') } }
      : {};
    
    const docs = await this.collection.find(query, { projection: { _id: 1 } }).toArray();
    return docs.map(doc => doc._id);
  }

  async has(key) {
    const count = await this.collection.countDocuments({ _id: key });
    return count > 0;
  }
}

/* ---------------- Redis Adapter ---------------- */
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
      await this.client.setEx(key, Math.floor(ttl / 1000), serialized);
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

/* ---------------- PostgreSQL Adapter ---------------- */
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

/* ---------------- MySQL Adapter ---------------- */
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

/* ---------------- Adapter Factory ---------------- */
function createAdapter(type, config) {
  const adapters = {
    'memory': MemoryAdapter,
    'local': MemoryAdapter,
    'mongodb': MongoDBAdapter,
    'mongo': MongoDBAdapter,
    'redis': RedisAdapter,
    'postgresql': PostgreSQLAdapter,
    'postgres': PostgreSQLAdapter,
    'pg': PostgreSQLAdapter,
    'mysql': MySQLAdapter
  };

  const AdapterClass = adapters[type.toLowerCase()];

  if (!AdapterClass) {
    throw new Error(
      `❌ Unknown database type: "${type}"\n\n` +
      `   Supported types:\n` +
      `   - memory/local (built-in, no package needed)\n` +
      `   - mongodb/mongo (requires: npm install mongodb)\n` +
      `   - redis (requires: npm install redis)\n` +
      `   - postgresql/postgres/pg (requires: npm install pg)\n` +
      `   - mysql (requires: npm install mysql2)\n`
    );
  }

  return new AdapterClass(config);
}

export {
  DatabaseAdapter,
  MemoryAdapter,
  MongoDBAdapter,
  RedisAdapter,
  PostgreSQLAdapter,
  MySQLAdapter,
  createAdapter
};
