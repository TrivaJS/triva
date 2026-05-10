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
