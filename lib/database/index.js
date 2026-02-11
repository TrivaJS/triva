/*!
 * Triva - Database Adapters
 * Factory and exports for all database adapters
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { DatabaseAdapter } from './base-adapter.js';
import { MemoryAdapter } from './memory.js';
import { EmbeddedAdapter } from './embedded.js';
import { SQLiteAdapter } from './sqlite.js';
import { BetterSQLite3Adapter } from './better-sqlite3.js';
import { MongoDBAdapter } from './mongodb.js';
import { RedisAdapter } from './redis.js';
import { PostgreSQLAdapter } from './postgresql.js';
import { SupabaseAdapter } from './supabase.js';
import { MySQLAdapter } from './mysql.js';

/**
 * Creates database adapter instance based on type.
 * 
 * @param {string} type - Adapter type (memory, mongodb, redis, etc.)
 * @param {Object} config - Adapter configuration
 * @returns {DatabaseAdapter} Configured adapter instance
 * 
 * @example
 * const adapter = createAdapter('memory', {});
 * 
 * @example
 * const adapter = createAdapter('mongodb', {
 *   uri: 'mongodb://localhost:27017/mydb'
 * });
 */
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
