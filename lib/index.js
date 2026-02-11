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
import { createRedirectMiddleware } from './redirect.js';

/* ---------------- Request Context ---------------- */

/**
 * Request context wrapper that enhances the native Node.js request object.
 * Provides convenient methods for parsing request data and accessing route information.
 * 
 * @class
 * @param {http.IncomingMessage} req - The incoming HTTP request
 * @param {http.ServerResponse} res - The HTTP response object
 * @param {Object} [routeParams={}] - Route parameters extracted from the URL path
 * 
 * @property {http.IncomingMessage} req - Original Node.js request object
 * @property {http.ServerResponse} res - Original Node.js response object
 * @property {Object} params - Route parameters (e.g., { id: '123' } from '/users/:id')
 * @property {Object} query - Parsed query string parameters
 * @property {*} body - Cached request body (populated after json() or text())
 * @property {Object} triva - Custom Triva metadata attached to request
 * @property {string} pathname - URL pathname without query string
 * 
 * @example
 * // Inside route handler
 * get('/users/:id', async (req, res) => {
 *   const userId = req.params.id;        // Route parameter
 *   const search = req.query.search;     // Query parameter from ?search=...
 *   const body = await req.json();       // Parse JSON body
 * });
 */
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

  /**
   * Parse request body as JSON.
   * Result is cached - subsequent calls return the same parsed object.
   * 
   * @async
   * @returns {Promise<Object>} Parsed JSON object
   * @throws {Error} If request body is not valid JSON
   * 
   * @example
   * post('/api/users', async (req, res) => {
   *   const userData = await req.json();
   *   console.log(userData.name, userData.email);
   * });
   */
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

  /**
   * Parse request body as plain text.
   * Result is cached - subsequent calls return the same string.
   * 
   * @async
   * @returns {Promise<string>} Request body as string
   * 
   * @example
   * post('/api/data', async (req, res) => {
   *   const rawData = await req.text();
   *   console.log('Received:', rawData);
   * });
   */
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

/**
 * Response helper methods that enhance the native Node.js response object.
 * Provides chainable methods for setting status codes, headers, and sending responses.
 * 
 * @class
 * @param {http.ServerResponse} res - The HTTP response object
 * 
 * @property {http.ServerResponse} res - Original Node.js response object
 * 
 * @example
 * get('/api/user', (req, res) => {
 *   res.status(200).json({ name: 'John' });
 * });
 * 
 * @example
 * get('/error', (req, res) => {
 *   res.status(404).header('X-Custom', 'value').send('Not Found');
 * });
 */
class ResponseHelpers {
  constructor(res) {
    this.res = res;
  }

  /**
   * Set HTTP status code.
   * 
   * @param {number} code - HTTP status code (e.g., 200, 404, 500)
   * @returns {ResponseHelpers} Returns this for chaining
   * 
   * @example
   * res.status(201).json({ created: true });
   * res.status(404).send('Not Found');
   * res.status(500).json({ error: 'Internal Server Error' });
   */
  status(code) {
    this.res.statusCode = code;
    return this;
  }

  /**
   * Set a response header.
   * 
   * @param {string} name - Header name
   * @param {string} value - Header value
   * @returns {ResponseHelpers} Returns this for chaining
   * 
   * @example
   * res.header('Content-Type', 'text/html').send('<h1>Hello</h1>');
   * res.header('X-Custom-Header', 'value').json({ data: 'response' });
   */
  header(name, value) {
    this.res.setHeader(name, value);
    return this;
  }

  /**
   * Send JSON response.
   * Automatically sets Content-Type to application/json.
   * 
   * @param {*} data - Data to be JSON-stringified and sent
   * @returns {ResponseHelpers} Returns this for chaining
   * 
   * @example
   * res.json({ users: [1, 2, 3] });
   * res.status(201).json({ created: true });
   * res.json({ error: 'Not found' });
   */
  json(data) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'application/json');
      this.res.end(JSON.stringify(data));
    }
    return this;
  }

  /**
   * Send plain text or HTML response.
   * 
   * @param {string|Buffer} data - Data to send
   * @returns {ResponseHelpers} Returns this for chaining
   * 
   * @example
   * res.send('Hello World');
   * res.status(404).send('Not Found');
   * res.send('<h1>HTML Content</h1>');
   */
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

/**
 * Build and configure the Triva server.
 * This is the main entry point for configuring all server features.
 * 
 * @async
 * @param {Object} [options={}] - Server configuration options
 * @param {string} [options.env='development'] - Environment (development, production, test)
 * @param {string} [options.protocol='http'] - Protocol ('http' or 'https')
 * @param {Object} [options.ssl] - SSL configuration for HTTPS (key, cert)
 * @param {Object} [options.cache] - Cache configuration
 * @param {string} [options.cache.type='memory'] - Cache type (memory, embedded, sqlite, mongodb, redis, etc.)
 * @param {Object} [options.cache.database] - Database-specific configuration
 * @param {Object} [options.middleware] - Middleware configuration
 * @param {Object} [options.throttle] - Request throttling configuration
 * @param {number} [options.throttle.limit=100] - Max requests per window
 * @param {number} [options.throttle.window_ms=60000] - Time window in milliseconds
 * @param {Object} [options.retention] - Cache retention configuration
 * @param {Object} [options.errorTracking] - Error tracking configuration
 * @param {Object} [options.redirects] - Auto-redirect configuration
 * @param {boolean} [options.redirects.enabled=false] - Enable auto-redirects
 * @param {boolean} [options.redirects.redirectAI=false] - Redirect AI traffic
 * @param {boolean} [options.redirects.redirectBots=false] - Redirect bot traffic
 * @param {boolean} [options.redirects.redirectCrawlers=false] - Redirect crawler traffic
 * @param {string|Function} [options.redirects.destination] - Redirect destination URL or function
 * @param {number} [options.redirects.statusCode=302] - HTTP redirect status code
 * @param {Array} [options.redirects.customRules=[]] - Custom redirect rules
 * @param {Array} [options.redirects.whitelist=[]] - User-Agents to never redirect
 * @param {boolean} [options.redirects.bypassThrottle=true] - Skip throttling for redirected traffic
 * @param {boolean} [options.redirects.logRedirects=false] - Log redirects for debugging
 * @returns {Promise<TrivaServer>} Configured server instance
 * 
 * @example
 * // Basic HTTP server
 * await build({
 *   env: 'production',
 *   cache: { type: 'memory' }
 * });
 * 
 * @example
 * // HTTPS server with MongoDB cache
 * await build({
 *   protocol: 'https',
 *   ssl: {
 *     key: fs.readFileSync('./key.pem'),
 *     cert: fs.readFileSync('./cert.pem')
 *   },
 *   cache: {
 *     type: 'mongodb',
 *     database: {
 *       uri: 'mongodb://localhost:27017/myapp'
 *     }
 *   }
 * });
 * 
 * @example
 * // Redirect AI traffic
 * await build({
 *   redirects: {
 *     enabled: true,
 *     redirectAI: true,
 *     redirectBots: true,
 *     destination: 'https://bots.example.com',
 *     whitelist: ['Googlebot', 'Bingbot'],
 *     logRedirects: true
 *   }
 * });
 * 
 * @example
 * // Custom redirect rules
 * await build({
 *   redirects: {
 *     enabled: true,
 *     customRules: [
 *       {
 *         name: 'Redirect scrapers from API',
 *         condition: (req) => req.url.startsWith('/api/') && /scraper/i.test(req.headers['user-agent']),
 *         destination: '/api-docs',
 *         statusCode: 302
 *       },
 *       {
 *         name: 'Dynamic AI routing',
 *         condition: (req) => /GPTBot|Claude/i.test(req.headers['user-agent']),
 *         destination: (req) => 'https://ai-api.example.com' + req.url,
 *         statusCode: 307
 *       }
 *     ]
 *   }
 * });
 */
async function build(options = {}) {
  globalServer = new TrivaServer(options);
  
  // Centralized configuration
  if (options.cache) {
    await configCache(options.cache);
  }
  
  // Auto-redirect middleware (runs before throttling)
  if (options.redirects && options.redirects.enabled) {
    const redirectMw = createRedirectMiddleware(options.redirects);
    globalServer.use(redirectMw);
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
  del,
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
