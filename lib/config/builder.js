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

import { TrivaServer } from '../core/index.js';
import { configCache } from '../utils/cache.js';
import { middleware as createMiddleware } from '../middleware/index.js';
import { errorTracker } from '../middleware/error-tracker.js';
import { checkForUpdates } from '../utils/update-check.js';

/**
 * build - Main Triva application class.
 *
 * Create a server instance with configuration. Multiple instances are fully
 * independent, each with their own routes, middleware, and settings.
 *
 * @class
 * @extends TrivaServer
 *
 * @example
 * import { build } from 'triva';
 *
 * const app = new build({ env: 'development' });
 *
 * app.get('/', (req, res) => res.json({ hello: 'world' }));
 * app.listen(3000);
 *
 * @example
 * // Multiple instances on different ports
 * const api   = new build({ env: 'production' });
 * const admin = new build({ env: 'production' });
 *
 * api.get('/data', handler);
 * admin.get('/dashboard', handler);
 *
 * api.listen(3000);
 * admin.listen(4000);
 */
class build extends TrivaServer {
  constructor(options = {}) {
    super(options);
    this._init(options);
  }

  async _init(options) {
    // Update check — fire and forget, never blocks, dev/test only
    checkForUpdates('1.1.0').catch(() => {});

    // Cache / database
    if (options.cache) {
      try {
        await configCache(options.cache);
      } catch (err) {
        console.error('Triva: cache configuration error:', err.message);
      }
    }

    // Throttle / retention middleware
    const throttleOpts  = options.throttle  || options.middleware?.throttle;
    const retentionOpts = options.retention || options.middleware?.retention;
    if (throttleOpts || retentionOpts) {
      const mw = createMiddleware({
        ...options.middleware,
        throttle:  throttleOpts,
        retention: retentionOpts
      });
      this.use(mw);
    }

    // Error tracking
    if (options.errorTracking) {
      errorTracker.configure(options.errorTracking);
    }
  }
}

export { build };
export default build;
