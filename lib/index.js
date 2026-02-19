/*!
 * Triva
 * Enterprise-grade Node.js HTTP/HTTPS framework
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

// Main class — import build and instantiate your app
export { build, build as default } from './config/builder.js';

// Lower-level server class (advanced: extend or test in isolation)
export { TrivaServer } from './core/index.js';

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

// Middleware factories (advanced / manual use)
export { middleware } from './middleware/index.js';
export { createRedirectMiddleware, createRule } from './middleware/redirect.js';
export { errorTracker } from './middleware/error-tracker.js';
export { log } from './middleware/logger.js';

// Utilities
export { cache, configCache } from './utils/cache.js';
export { cookieParser } from './utils/cookie-parser.js';
export { parseUA, isBot, isCrawler, isAI } from './utils/ua-parser.js';
export {
  checkForUpdates,
  clearCache as clearUpdateCache,
  getCacheStatus as getUpdateCacheStatus
} from './utils/update-check.js';
