/*!
 * Triva - Route Matcher
 * URL pattern matching, parameter extraction, chained route builder
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

/**
 * Flatten and validate a list of handlers that may include arrays.
 * Supports: fn, [fn, fn], fn, fn, fn in any combination.
 */
function flattenHandlers(...args) {
  const handlers = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      for (const fn of arg) {
        if (typeof fn !== 'function') throw new Error('Route handler must be a function');
        handlers.push(fn);
      }
    } else if (typeof arg === 'function') {
      handlers.push(arg);
    } else {
      throw new Error('Route handler must be a function or array of functions');
    }
  }
  if (handlers.length === 0) throw new Error('At least one route handler is required');
  return handlers;
}

/**
 * Build a single composed handler from an array of handlers.
 * Each handler receives next() to call the following handler in the chain.
 */
function composeHandlers(handlers) {
  return async (req, res) => {
    let index = 0;
    const next = async (err) => {
      if (err) throw err;
      if (index >= handlers.length) return;
      const handler = handlers[index++];
      await handler(req, res, next);
    };
    await next();
  };
}

class RouteMatcher {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: [],
      PATCH: [],
      HEAD: [],
      OPTIONS: [],
      ALL: []
    };
  }

  _parsePattern(pattern) {
    const paramNames = [];
    const regexPattern = pattern
      .split('/')
      .map(segment => {
        if (segment.startsWith(':')) {
          paramNames.push(segment.slice(1));
          return '([^/]+)';
        }
        if (segment === '*') {
          return '.*';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    return {
      regex: new RegExp(`^${regexPattern}$`),
      paramNames
    };
  }

  addRoute(method, pattern, ...handlerArgs) {
    const handlers = flattenHandlers(...handlerArgs);
    const composed = composeHandlers(handlers);
    const parsed = this._parsePattern(pattern);
    const key = method.toUpperCase() === 'ALL' ? 'ALL' : method.toUpperCase();
    if (!this.routes[key]) throw new Error(`Unsupported HTTP method: ${method}`);
    this.routes[key].push({ pattern, ...parsed, handler: composed });
  }

  match(method, pathname) {
    const methodRoutes = this.routes[method.toUpperCase()] || [];
    const allRoutes = this.routes.ALL;

    for (const route of [...methodRoutes, ...allRoutes]) {
      const m = pathname.match(route.regex);
      if (m) {
        const params = {};
        route.paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
        return { handler: route.handler, params };
      }
    }

    return null;
  }
}

/**
 * RouteBuilder - returned by app.route(path) for chained HTTP method definitions.
 *
 * @example
 * app.route('/book')
 *   .get((req, res) => res.send('Get book'))
 *   .post((req, res) => res.send('Add book'))
 *   .put((req, res) => res.send('Update book'))
 */
class RouteBuilder {
  constructor(path, server) {
    this._path = path;
    this._server = server;
  }

  get(...args)   { this._server.get(this._path, ...args);   return this; }
  post(...args)  { this._server.post(this._path, ...args);  return this; }
  put(...args)   { this._server.put(this._path, ...args);   return this; }
  del(...args)   { this._server.del(this._path, ...args);   return this; }
  patch(...args) { this._server.patch(this._path, ...args); return this; }
  all(...args)   { this._server.all(this._path, ...args);   return this; }
}

export { RouteMatcher, RouteBuilder, flattenHandlers, composeHandlers };
