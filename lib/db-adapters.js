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

/* ---------------- Embedded Database Adapter (Encrypted JSON) ---------------- */
class EmbeddedAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dbPath = config.filename || './triva.db';
    this.encryptionKey = config.encryptionKey || null;
    this.data = new Map();
  }

  async connect() {
    try {
      const fs = await import('fs/promises');
      const crypto = await import('crypto');
      
      this.fs = fs;
      this.crypto = crypto;
      
      // Load existing database if it exists
      try {
        const fileContent = await fs.readFile(this.dbPath, 'utf8');
        
        if (this.encryptionKey) {
          // Decrypt data
          const decrypted = this._decrypt(fileContent);
          const parsed = JSON.parse(decrypted);
          this.data = new Map(Object.entries(parsed));
        } else {
          const parsed = JSON.parse(fileContent);
          this.data = new Map(Object.entries(parsed));
        }
      } catch (err) {
        // Database file doesn't exist or is empty, start fresh
        this.data = new Map();
      }
      
      this.connected = true;
      console.log(`✅ Connected to Embedded database at ${this.dbPath}`);
      return true;
    } catch (error) {
      console.error('❌ Embedded database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this._persist();
    this.connected = false;
    console.log('✅ Disconnected from Embedded database');
    return true;
  }

  async get(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.data.delete(key);
      await this._persist();
      return null;
    }
    
    return entry.value;
  }

  async set(key, value, ttl = null) {
    const entry = {
      value: value,
      expiresAt: ttl ? Date.now() + ttl : null
    };
    
    this.data.set(key, entry);
    await this._persist();
    return true;
  }

  async delete(key) {
    const result = this.data.delete(key);
    if (result) {
      await this._persist();
    }
    return result;
  }

  async clear() {
    const count = this.data.size;
    this.data.clear();
    await this._persist();
    return count;
  }

  async keys(pattern = null) {
    const allKeys = Array.from(this.data.keys());
    
    if (!pattern) return allKeys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async has(key) {
    return this.data.has(key);
  }

  async _persist() {
    try {
      // Convert Map to plain object
      const obj = Object.fromEntries(this.data);
      let content = JSON.stringify(obj, null, 2);
      
      // Encrypt if key is provided
      if (this.encryptionKey) {
        content = this._encrypt(content);
      }
      
      await this.fs.writeFile(this.dbPath, content, 'utf8');
    } catch (error) {
      console.error('❌ Failed to persist database:', error.message);
    }
  }

  _encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = this.crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = this.crypto.randomBytes(16);
    
    const cipher = this.crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  _decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = this.crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    
    const decipher = this.crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

/* ---------------- SQLite Adapter ---------------- */
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

/* ---------------- Better-SQLite3 Adapter ---------------- */
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

/* ---------------- Supabase Adapter ---------------- */
class SupabaseAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.tableName = config.tableName || 'triva_cache';
  }

  async connect() {
    try {
      // Dynamic import with helpful error
      let createClient;
      try {
        const supabase = await import('@supabase/supabase-js');
        createClient = supabase.createClient;
      } catch (err) {
        throw new Error(
          '❌ Supabase package not found\n\n' +
          '   Install with: npm install @supabase/supabase-js\n' +
          '   Documentation: https://supabase.com/docs/reference/javascript/installing\n'
        );
      }

      // Validate required config
      if (!this.config.url || !this.config.key) {
        throw new Error(
          '❌ Supabase requires url and key\n\n' +
          '   Example:\n' +
          '   cache: {\n' +
          '     type: "supabase",\n' +
          '     database: {\n' +
          '       url: "https://xxx.supabase.co",\n' +
          '       key: "your-anon-key"\n' +
          '     }\n' +
          '   }\n'
        );
      }

      // Create Supabase client
      this.client = createClient(this.config.url, this.config.key, this.config.options || {});

      // Create table if not exists using SQL
      const { error } = await this.client.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            expires_at TIMESTAMPTZ
          );
          
          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at 
          ON ${this.tableName} (expires_at);
        `
      });

      // If exec_sql doesn't exist, try direct query (for newer Supabase)
      if (error && error.message.includes('exec_sql')) {
        // Table might already exist, or we need to create it manually
        // For Supabase, users should create table via Dashboard or migrations
        console.log('⚠️  Supabase table setup: Create table via Dashboard or SQL Editor:');
        console.log(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            expires_at TIMESTAMPTZ
          );
          
          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at 
          ON ${this.tableName} (expires_at);
        `);
      }

      this.connected = true;
      console.log('✅ Connected to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    // Supabase client doesn't need explicit disconnect
    this.connected = false;
    console.log('✅ Disconnected from Supabase');
    return true;
  }

  async get(key) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('value')
      .eq('key', key)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data?.value || null;
  }

  async set(key, value, ttl = null) {
    const expiresAt = ttl ? new Date(Date.now() + ttl).toISOString() : null;

    const { error } = await this.client
      .from(this.tableName)
      .upsert({
        key: key,
        value: value,
        expires_at: expiresAt
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
    return true;
  }

  async delete(key) {
    const { error, count } = await this.client
      .from(this.tableName)
      .delete({ count: 'exact' })
      .eq('key', key);

    if (error) throw error;
    return count > 0;
  }

  async clear() {
    const { error, count } = await this.client
      .from(this.tableName)
      .delete({ count: 'exact' })
      .neq('key', ''); // Delete all (key is always non-empty)

    if (error) throw error;
    return count;
  }

  async keys(pattern = null) {
    let query = this.client
      .from(this.tableName)
      .select('key');

    if (pattern) {
      // Convert glob pattern to PostgreSQL regex
      const regex = '^' + pattern.replace(/\*/g, '.*') + '$';
      query = query.filter('key', 'match', regex);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(row => row.key);
  }

  async has(key) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('key', { count: 'exact', head: true })
      .eq('key', key)
      .limit(1);

    if (error) throw error;
    return data !== null;
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
    'embedded': EmbeddedAdapter,
    'sqlite': SQLiteAdapter,
    'sqlite3': SQLiteAdapter,
    'better-sqlite3': BetterSQLite3Adapter,
    'mongodb': MongoDBAdapter,
    'mongo': MongoDBAdapter,
    'redis': RedisAdapter,
    'postgresql': PostgreSQLAdapter,
    'postgres': PostgreSQLAdapter,
    'pg': PostgreSQLAdapter,
    'supabase': SupabaseAdapter,
    'mysql': MySQLAdapter
  };

  const AdapterClass = adapters[type.toLowerCase()];

  if (!AdapterClass) {
    throw new Error(
      `❌ Unknown database type: "${type}"\n\n` +
      `   Supported types:\n` +
      `   - memory/local (built-in, no package needed)\n` +
      `   - embedded (built-in, encrypted JSON file)\n` +
      `   - sqlite/sqlite3 (requires: npm install sqlite3)\n` +
      `   - better-sqlite3 (requires: npm install better-sqlite3)\n` +
      `   - mongodb/mongo (requires: npm install mongodb)\n` +
      `   - redis (requires: npm install redis)\n` +
      `   - postgresql/postgres/pg (requires: npm install pg)\n` +
      `   - supabase (requires: npm install @supabase/supabase-js)\n` +
      `   - mysql (requires: npm install mysql2)\n`
    );
  }

  return new AdapterClass(config);
}

export {
  DatabaseAdapter,
  MemoryAdapter,
  EmbeddedAdapter,
  SQLiteAdapter,
  BetterSQLite3Adapter,
  MongoDBAdapter,
  RedisAdapter,
  PostgreSQLAdapter,
  SupabaseAdapter,
  MySQLAdapter,
  createAdapter
};
