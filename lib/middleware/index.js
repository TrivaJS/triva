/*!
 * Triva - Middleware Factory
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { Throttle } from './throttle.js';
import { log } from './logger.js';
import { cache } from '../utils/cache.js';

/* ---------------- Middleware Core ---------------- */
class MiddlewareCore {
  constructor(options = {}) {
    this.options = options;

    if (options.throttle) this.throttle = new Throttle(options.throttle);

    const retention = {
      enabled: options.retention?.enabled !== false,
      maxEntries: Number(options.retention?.maxEntries) || 100_000,
    };

    log._setRetention(retention);
  }

  async handle(req, res, next) {
    try {
      if (this.throttle) {
        const ip = req.socket?.remoteAddress || req.connection?.remoteAddress;
        const ua = req.headers["user-agent"];
        
        // Pass full req as context so policies() has access to headers, url, method, etc.
        // bypassThrottle is read from req.triva.bypassThrottle inside check()
        const result = await this.throttle.check(ip, ua, req);

        req.triva = req.triva || {};
        req.triva.throttle = result;

        if (result.restricted) {
          res.statusCode = 429;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "throttled", reason: result.reason }));
          return;
        }
      }

      if (typeof next === "function") next();
      queueMicrotask(() => this.processSnapshot(req, res));
    } catch (err) {
      if (typeof next === "function") return next(err);
      throw err;
    }
  }

  processSnapshot(req) {
    const record = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: new Date().toISOString(),
      ip: req.socket?.remoteAddress || req.connection?.remoteAddress
    };

    const key = `log:request:${Date.now()}:${Math.random()}`;
    
    // Fire and forget
    cache.set(key, record).catch(() => {});
  }
}

/**
 * Create middleware instance
 * 
 * @param {Object} options - Middleware options
 * @returns {Function} Middleware function
 */
function middleware(options = {}) {
  const core = new MiddlewareCore(options);
  
  return function trivaMiddleware(req, res, next) {
    return core.handle(req, res, next);
  };
}

export { middleware, MiddlewareCore };
