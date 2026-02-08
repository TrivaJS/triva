/*!
 * Triva
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import http from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
import { parse as parseQuery } from 'querystring';
import { createReadStream, stat } from 'fs';
import { basename, extname } from 'path';
import { log } from './log.js';
import { cache, configCache } from './cache.js';
import { middleware as createMiddleware } from './middleware.js';
import { errorTracker } from './error-tracker.js';
import { cookieParser } from './cookie-parser.js';

/* ---------------- Request Context ---------------- */
class RequestContext {
  constructor(req, res, routeParams = {}) {
    this.req = req;
    this.res = res;
    this.params = routeParams;
    this.query = {};
    this.body = null;
    this.triva = req.triva || {};
    
    // Parse query string
    const parsedUrl = parseUrl(req.url, true);
    this.query = parsedUrl.query || {};
    this.pathname = parsedUrl.pathname;
  }

  async json() {
    if (this.body !== null) return this.body;
    
    return new Promise((resolve, reject) => {
      let data = '';
      this.req.on('data', chunk => {
        data += chunk.toString();
      });
      this.req.on('end', () => {
        try {
          this.body = JSON.parse(data);
          resolve(this.body);
        } catch (err) {
          reject(new Error('Invalid JSON'));
        }
      });
      this.req.on('error', reject);
    });
  }

  async text() {
    if (this.body !== null) return this.body;
    
    return new Promise((resolve, reject) => {
      let data = '';
      this.req.on('data', chunk => {
        data += chunk.toString();
      });
      this.req.on('end', () => {
        this.body = data;
        resolve(data);
      });
      this.req.on('error', reject);
    });
  }
}

/* ---------------- Response Helpers ---------------- */
class ResponseHelpers {
  constructor(res) {
    this.res = res;
  }

  status(code) {
    this.res.statusCode = code;
    return this;
  }

  header(name, value) {
    this.res.setHeader(name, value);
    return this;
  }

  json(data) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'application/json');
      this.res.end(JSON.stringify(data));
    }
    return this;
  }

  send(data) {
    if (this.res.writableEnded) {
      return this;
    }
    
    // If object, send as JSON
    if (typeof data === 'object') {
      return this.json(data);
    }
    
    const stringData = String(data);
    
    // Auto-detect HTML content
    if (stringData.trim().startsWith('<') && 
        (stringData.includes('</') || stringData.includes('/>'))) {
      this.res.setHeader('Content-Type', 'text/html');
    } else {
      this.res.setHeader('Content-Type', 'text/plain');
    }
    
    this.res.end(stringData);
    return this;
  }

  html(data) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'text/html');
      this.res.end(data);
    }
    return this;
  }

  redirect(url, code = 302) {
    this.res.statusCode = code;
    this.res.setHeader('Location', url);
    this.res.end();
    return this;
  }

  jsonp(data, callbackParam = 'callback') {
    if (this.res.writableEnded) {
      return this;
    }

    // Get callback name from query parameter
    const parsedUrl = parseUrl(this.res.req?.url || '', true);
    const callback = parsedUrl.query[callbackParam] || 'callback';

    // Sanitize callback name (only allow safe characters)
    const safeCallback = callback.replace(/[^\[\]\w$.]/g, '');

    // Create JSONP response
    const jsonString = JSON.stringify(data);
    const body = `/**/ typeof ${safeCallback} === 'function' && ${safeCallback}(${jsonString});`;

    this.res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    this.res.setHeader('X-Content-Type-Options', 'nosniff');
    this.res.end(body);
    return this;
  }

  download(filepath, filename = null) {
    if (this.res.writableEnded) {
      return this;
    }

    const downloadName = filename || basename(filepath);

    stat(filepath, (err, stats) => {
      if (err) {
        this.res.statusCode = 404;
        this.res.end('File not found');
        return;
      }

      // Set headers for download
      this.res.setHeader('Content-Type', 'application/octet-stream');
      this.res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      this.res.setHeader('Content-Length', stats.size);

      // Stream file to response
      const fileStream = createReadStream(filepath);
      fileStream.pipe(this.res);

      fileStream.on('error', (streamErr) => {
        if (!this.res.writableEnded) {
          this.res.statusCode = 500;
          this.res.end('Error reading file');
        }
      });
    });

    return this;
  }

  sendFile(filepath, options = {}) {
    if (this.res.writableEnded) {
      return this;
    }

    stat(filepath, (err, stats) => {
      if (err) {
        this.res.statusCode = 404;
        this.res.end('File not found');
        return;
      }

      // Determine content type from extension
      const ext = extname(filepath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.xml': 'application/xml'
      };

      const contentType = options.contentType || contentTypes[ext] || 'application/octet-stream';

      // Set headers
      this.res.setHeader('Content-Type', contentType);
      this.res.setHeader('Content-Length', stats.size);

      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          this.res.setHeader(key, options.headers[key]);
        });
      }

      // Stream file to response
      const fileStream = createReadStream(filepath);
      fileStream.pipe(this.res);

      fileStream.on('error', (streamErr) => {
        if (!this.res.writableEnded) {
          this.res.statusCode = 500;
          this.res.end('Error reading file');
        }
      });
    });

    return this;
  }

  end(data) {
    if (!this.res.writableEnded) {
      this.res.end(data);
    }
    return this;
  }
}

/* ---------------- Route Matcher ---------------- */
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
class TrivaServer {
  constructor(options = {}) {
    this.options = {
      env: options.env || 'production',
      ...options
    };
    
    this.server = null;
    this.router = new RouteMatcher();
    this.middlewareStack = [];
    this.errorHandler = this._defaultErrorHandler.bind(this);
    this.notFoundHandler = this._defaultNotFoundHandler.bind(this);
    
    // Bind routing methods
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
    this.patch = this.patch.bind(this);
    this.use = this.use.bind(this);
    this.listen = this.listen.bind(this);
  }

  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewareStack.push(middleware);
    return this;
  }

  get(pattern, handler) {
    this.router.addRoute('GET', pattern, handler);
    return this;
  }

  post(pattern, handler) {
    this.router.addRoute('POST', pattern, handler);
    return this;
  }

  put(pattern, handler) {
    this.router.addRoute('PUT', pattern, handler);
    return this;
  }

  delete(pattern, handler) {
    this.router.addRoute('DELETE', pattern, handler);
    return this;
  }

  patch(pattern, handler) {
    this.router.addRoute('PATCH', pattern, handler);
    return this;
  }

  setErrorHandler(handler) {
    this.errorHandler = handler;
    return this;
  }

  setNotFoundHandler(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  async _runMiddleware(req, res) {
    for (const middleware of this.middlewareStack) {
      try {
        await new Promise((resolve, reject) => {
          try {
            middleware(req, res, (err) => {
              if (err) reject(err);
              else resolve();
            });
          } catch (err) {
            reject(err);
          }
        });
      } catch (err) {
        // Capture middleware errors with context
        await errorTracker.capture(err, {
          req,
          phase: 'middleware',
          handler: middleware.name || 'anonymous',
          pathname: parseUrl(req.url).pathname,
          uaData: req.triva?.throttle?.uaData
        });
        throw err; // Re-throw to be handled by main error handler
      }
    }
  }

  async _handleRequest(req, res) {
    try {
      // Enhance request and response objects
      req.triva = req.triva || {};
      
      // Store req reference in res for methods that need it (like jsonp)
      res.req = req;
      
      // Add helper methods directly to res object
      const helpers = new ResponseHelpers(res);
      res.status = helpers.status.bind(helpers);
      res.header = helpers.header.bind(helpers);
      res.json = helpers.json.bind(helpers);
      res.send = helpers.send.bind(helpers);
      res.html = helpers.html.bind(helpers);
      res.redirect = helpers.redirect.bind(helpers);
      res.jsonp = helpers.jsonp.bind(helpers);
      res.download = helpers.download.bind(helpers);
      res.sendFile = helpers.sendFile.bind(helpers);

      // Run middleware stack
      await this._runMiddleware(req, res);

      // Check if response was already sent by middleware
      if (res.writableEnded) return;

      const parsedUrl = parseUrl(req.url, true);
      const pathname = parsedUrl.pathname;

      // Route matching
      const match = this.router.match(req.method, pathname);

      if (!match) {
        return this.notFoundHandler(req, res);
      }

      // Create context
      const context = new RequestContext(req, res, match.params);

      // Execute route handler with error tracking
      try {
        await match.handler(context, res);
      } catch (handlerError) {
        // Capture route handler errors
        await errorTracker.capture(handlerError, {
          req,
          phase: 'route',
          route: pathname,
          handler: 'route_handler',
          pathname,
          uaData: req.triva?.throttle?.uaData
        });
        throw handlerError;
      }

    } catch (err) {
      // Capture top-level request errors if not already captured
      if (!err._trivaTracked) {
        await errorTracker.capture(err, {
          req,
          phase: 'request',
          pathname: parseUrl(req.url).pathname,
          uaData: req.triva?.throttle?.uaData
        });
        err._trivaTracked = true; // Mark to avoid double-tracking
      }
      
      this.errorHandler(err, req, res);
    }
  }

  _defaultErrorHandler(err, req, res) {
    console.error('Server Error:', err);
    
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      
      const response = {
        error: 'Internal Server Error',
        message: this.options.env === 'development' ? err.message : undefined,
        stack: this.options.env === 'development' ? err.stack : undefined
      };
      
      res.end(JSON.stringify(response));
    }
  }

  _defaultNotFoundHandler(req, res) {
    if (!res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Not Found',
        path: req.url
      }));
    }
  }

  listen(port, callback) {
    const { protocol = 'http', ssl } = this.options;
    
    // Validate HTTPS configuration
    if (protocol === 'https') {
      if (!ssl || !ssl.key || !ssl.cert) {
        throw new Error(
          'HTTPS requires ssl.key and ssl.cert in options.\n' +
          'Example: build({ protocol: "https", ssl: { key: fs.readFileSync("key.pem"), cert: fs.readFileSync("cert.pem") } })'
        );
      }
      
      this.server = https.createServer({
        key: ssl.key,
        cert: ssl.cert,
        ...ssl.options
      }, (req, res) => {
        this._handleRequest(req, res);
      });
    } else {
      this.server = http.createServer((req, res) => {
        this._handleRequest(req, res);
      });
    }

    this.server.listen(port, () => {
      const serverType = protocol.toUpperCase();
      console.log(`Triva ${serverType} server listening on port ${port} (${this.options.env})`);
      if (callback) callback();
    });

    return this.server;
  }

  close(callback) {
    if (this.server) {
      this.server.close(callback);
    }
    return this;
  }
}

/* ---------------- Factory & Exports ---------------- */
let globalServer = null;

async function build(options = {}) {
  globalServer = new TrivaServer(options);
  
  // Centralized configuration
  if (options.cache) {
    await configCache(options.cache);
  }
  
  if (options.middleware || options.throttle || options.retention) {
    const middlewareOptions = {
      ...options.middleware,
      throttle: options.throttle || options.middleware?.throttle,
      retention: options.retention || options.middleware?.retention
    };
    
    if (middlewareOptions.throttle || middlewareOptions.retention) {
      const mw = createMiddleware(middlewareOptions);
      globalServer.use(mw);
    }
  }
  
  if (options.errorTracking) {
    errorTracker.configure(options.errorTracking);
  }
  
  return globalServer;
}

function middleware(options = {}) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  
  const mw = createMiddleware(options);
  globalServer.use(mw);
  return globalServer;
}

function get(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.get(pattern, handler);
}

function post(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.post(pattern, handler);
}

function put(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.put(pattern, handler);
}

function del(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.delete(pattern, handler);
}

function patch(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.patch(pattern, handler);
}

function use(middleware) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.use(middleware);
}

function listen(port, callback) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.listen(port, callback);
}

function setErrorHandler(handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.setErrorHandler(handler);
}

function setNotFoundHandler(handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.setNotFoundHandler(handler);
}

export {
  build,
  middleware,
  get,
  post,
  put,
  del as delete,
  patch,
  use,
  listen,
  setErrorHandler,
  setNotFoundHandler,
  TrivaServer,
  log,
  cache,
  configCache,
  errorTracker,
  cookieParser
};
