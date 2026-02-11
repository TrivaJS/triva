/*!
 * Triva
 * Enterprise-grade Node.js HTTP/HTTPS framework
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

// Core server functionality
export { 
  TrivaServer, 
  RequestContext, 
  ResponseHelpers,
  get,
  post,
  put,
  del,
  patch,
  use,
  listen
} from './core/index.js';

// Configuration
export { build } from './config/builder.js';

// Database adapters
export { 
  createAdapter,
  DatabaseAdapter,
  MemoryAdapter,
  EmbeddedAdapter,
  SQLiteAdapter,
  BetterSQLite3Adapter,
  MongoDBAdapter,
  RedisAdapter,
  PostgreSQLAdapter,
  SupabaseAdapter,
  MySQLAdapter
} from './database/index.js';

// Middleware
export { middleware } from './middleware/index.js';
export { createRedirectMiddleware, createRule } from './middleware/redirect.js';
export { errorTracker } from './middleware/error-tracker.js';
export { log } from './middleware/logger.js';

// Utilities
export { cache, configCache } from './utils/cache.js';
export { cookieParser } from './utils/cookie-parser.js';
export { parseUA } from './utils/ua-parser.js';
export { 
  checkForUpdates, 
  clearCache as clearUpdateCache,
  getCacheStatus as getUpdateCacheStatus
} from './utils/update-check.js';
