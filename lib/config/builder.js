/*!
 * Triva - build class
 * Class-based server construction supporting multiple simultaneous instances.
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { TrivaServer } from '../core/index.js';
import { configCache } from '../utils/cache.js';
import { middleware as createMiddleware } from '../middleware/index.js';
import { createRedirectMiddleware } from '../middleware/redirect.js';
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

    // Redirect middleware (runs before throttle)
    if (options.redirects?.enabled) {
      this.use(createRedirectMiddleware(options.redirects));
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
