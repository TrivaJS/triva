/*!
 * Triva - Route Matcher
 * URL pattern matching and parameter extraction
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

class RouteMatcher {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: [],
      PATCH: [],
      HEAD: [],
      OPTIONS: []
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
        return segment;
      })
      .join('/');
    
    return {
      regex: new RegExp(`^${regexPattern}$`),
      paramNames
    };
  }

  addRoute(method, pattern, handler) {
    const parsed = this._parsePattern(pattern);
    this.routes[method.toUpperCase()].push({
      pattern,
      ...parsed,
      handler
    });
  }

  match(method, pathname) {
    const routes = this.routes[method.toUpperCase()] || [];
    
    for (const route of routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return { handler: route.handler, params };
      }
    }
    
    return null;
  }
}

/* ---------------- Server Core ---------------- */

export { RouteMatcher };
