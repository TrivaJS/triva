/*!
 * Triva - Configuration Builder
 * Centralized build configuration logic
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { TrivaServer, setGlobalServer } from '../core/index.js';
import { configCache } from '../utils/cache.js';
import { middleware as createMiddleware } from '../middleware/index.js';
import { createRedirectMiddleware } from '../middleware/redirect.js';
import { errorTracker } from '../middleware/error-tracker.js';
import { checkForUpdates } from '../utils/update-check.js';

/**
 * Build and configure the Triva server.
 * This is the main entry point for configuring all server features.
 * 
 * @async
 * @param {Object} [options={}] - Server configuration options
 * @returns {Promise<TrivaServer>} Configured server instance
 */
async function build(options = {}) {
  const server = new TrivaServer(options);
  
  // Set as global server instance
  setGlobalServer(server);
  
  // Check for updates (fire and forget, non-blocking)
  // Only runs in development/test, not production or CI
  checkForUpdates('1.0.0').catch(() => {
    // Silently ignore errors - never break user's app
  });
  
  // Centralized configuration
  if (options.cache) {
    await configCache(options.cache);
  }
  
  // Auto-redirect middleware (runs before throttling)
  if (options.redirects && options.redirects.enabled) {
    const redirectMw = createRedirectMiddleware(options.redirects);
    server.use(redirectMw);
  }
  
  if (options.middleware || options.throttle || options.retention) {
    const middlewareOptions = {
      ...options.middleware,
      throttle: options.throttle || options.middleware?.throttle,
      retention: options.retention || options.middleware?.retention
    };
    
    if (middlewareOptions.throttle || middlewareOptions.retention) {
      const mw = createMiddleware(middlewareOptions);
      server.use(mw);
    }
  }
  
  if (options.errorTracking) {
    errorTracker.configure(options.errorTracking);
  }
  
  return server;
}

export { build };
