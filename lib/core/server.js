/*!
 * Triva - HTTP/HTTPS Server
 * Class-based server supporting multiple instances, chained routes,
 * template engines, settings API, and variadic/array middleware handlers.
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import http from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
import { readFile } from 'fs';
import { join, extname, resolve } from 'path';
import { RequestContext } from './request-context.js';
import { ResponseHelpers } from './response-helpers.js';
import { RouteMatcher, RouteBuilder } from './router.js';
import { errorTracker } from '../middleware/error-tracker.js';

class TrivaServer {
  constructor(options = {}) {
    this.options = {
      env: options.env || 'production',
      ...options
    };

    this.server       = null;
    this.router       = new RouteMatcher();
    this.middlewareStack = [];
    this.errorHandler    = this._defaultErrorHandler.bind(this);
    this.notFoundHandler = this._defaultNotFoundHandler.bind(this);

    // Settings store (for set/enable/disable)
    this._settings = {
      'env': this.options.env,
      'views': resolve('./views'),
      'view engine': null,
      'trust proxy': false,
      'x-powered-by': true,
    };

    // Template engine registry: { ext -> fn(filePath, options, callback) }
    this._engines = {};
  }

  // ─── Settings API ───────────────────────────────────────────────────────────

  /**
   * Set a configuration value.
   * @param {string} key
   * @param {*} value
   * @returns {TrivaServer}
   */
  set(key, value) {
    this._settings[key] = value;
    return this;
  }

  /**
   * Get a configuration value.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    // If called with only one string arg and it matches a setting key, return the value.
    // Otherwise fall through to route registration (handled below).
    if (arguments.length === 1 && typeof key === 'string' && key in this._settings) {
      return this._settings[key];
    }
    // Route: get(pattern, ...handlers)
    return this._addRoute('GET', ...arguments);
  }

  /**
   * Enable a boolean setting.
   * @param {string} key
   * @returns {TrivaServer}
   */
  enable(key) {
    this._settings[key] = true;
    return this;
  }

  /**
   * Disable a boolean setting.
   * @param {string} key
   * @returns {TrivaServer}
   */
  disable(key) {
    this._settings[key] = false;
    return this;
  }

  /**
   * Returns true if the setting is enabled.
   * @param {string} key
   * @returns {boolean}
   */
  enabled(key) {
    return Boolean(this._settings[key]);
  }

  /**
   * Returns true if the setting is disabled.
   * @param {string} key
   * @returns {boolean}
   */
  disabled(key) {
    return !this._settings[key];
  }

  // ─── Template Engine ─────────────────────────────────────────────────────────

  /**
   * Register a template engine for a file extension.
   *
   * @param {string} ext - File extension (with or without leading dot)
   * @param {Function} fn - fn(filePath, options, callback)
   * @returns {TrivaServer}
   *
   * @example
   * app.engine('html', (filePath, options, callback) => {
   *   fs.readFile(filePath, (err, content) => {
   *     if (err) return callback(err);
   *     const rendered = content.toString().replace('{{title}}', options.title);
   *     return callback(null, rendered);
   *   });
   * });
   */
  engine(ext, fn) {
    if (typeof fn !== 'function') throw new Error('engine() requires a callback function');
    const normalised = ext.startsWith('.') ? ext : `.${ext}`;
    this._engines[normalised] = fn;
    return this;
  }

  // ─── Routing ─────────────────────────────────────────────────────────────────

  _addRoute(method, pattern, ...handlerArgs) {
    this.router.addRoute(method, pattern, ...handlerArgs);
    return this;
  }

  // Disambiguated get: route registration (called when args.length > 1 or first arg isn't a setting key)
  // Already handled inside get() above; exported helper below is safe.

  post(pattern, ...handlerArgs)  { return this._addRoute('POST',   pattern, ...handlerArgs); }
  put(pattern, ...handlerArgs)   { return this._addRoute('PUT',    pattern, ...handlerArgs); }
  del(pattern, ...handlerArgs)   { return this._addRoute('DELETE', pattern, ...handlerArgs); }
  delete(pattern, ...handlerArgs){ return this._addRoute('DELETE', pattern, ...handlerArgs); }
  patch(pattern, ...handlerArgs) { return this._addRoute('PATCH',  pattern, ...handlerArgs); }

  /**
   * Register a handler for ALL HTTP methods on a path.
   *
   * @example
   * app.all('/secret', (req, res) => {
   *   res.send('Method: ' + req.method);
   * });
   */
  all(pattern, ...handlerArgs) { return this._addRoute('ALL', pattern, ...handlerArgs); }

  /**
   * Return a RouteBuilder for chained method registration on a single path.
   *
   * @param {string} path
   * @returns {RouteBuilder}
   *
   * @example
   * app.route('/book')
   *   .get((req, res) => res.send('Get book'))
   *   .post((req, res) => res.send('Add book'))
   *   .put((req, res) => res.send('Update book'));
   */
  route(path) {
    return new RouteBuilder(path, this);
  }

  // ─── Middleware ───────────────────────────────────────────────────────────────

  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewareStack.push(middleware);
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

  // ─── Internal Request Handling ────────────────────────────────────────────────

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
        if (res.writableEnded) return; // Middleware ended the response
      } catch (err) {
        await errorTracker.capture(err, {
          req,
          phase: 'middleware',
          handler: middleware.name || 'anonymous',
          pathname: parseUrl(req.url).pathname,
          uaData: req.triva?.throttle?.uaData
        });
        throw err;
      }
    }
  }

  async _handleRequest(req, res) {
    try {
      req.triva = req.triva || {};
      res.req   = req;

      // Attach response helpers
      const helpers = new ResponseHelpers(res, this);
      res.status   = helpers.status.bind(helpers);
      res.header   = helpers.header.bind(helpers);
      res.json     = helpers.json.bind(helpers);
      res.send     = helpers.send.bind(helpers);
      res.html     = helpers.html.bind(helpers);
      res.redirect = helpers.redirect.bind(helpers);
      res.jsonp    = helpers.jsonp.bind(helpers);
      res.download = helpers.download.bind(helpers);
      res.sendFile = helpers.sendFile.bind(helpers);
      res.render   = helpers.render.bind(helpers);

      await this._runMiddleware(req, res);
      if (res.writableEnded) return;

      const parsedUrl = parseUrl(req.url, true);
      const pathname  = parsedUrl.pathname;
      const match     = this.router.match(req.method, pathname);

      if (!match) {
        return this.notFoundHandler(req, res);
      }

      const context = new RequestContext(req, res, match.params);
      req.params   = context.params;
      req.query    = context.query;
      req.pathname = context.pathname;
      req.json     = context.json.bind(context);
      req.text     = context.text.bind(context);

      try {
        await match.handler(req, res);
      } catch (handlerError) {
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
      if (!err._trivaTracked) {
        await errorTracker.capture(err, {
          req,
          phase: 'request',
          pathname: parseUrl(req.url).pathname,
          uaData: req.triva?.throttle?.uaData
        });
        err._trivaTracked = true;
      }
      this.errorHandler(err, req, res);
    }
  }

  _defaultErrorHandler(err, req, res) {
    console.error('Server Error:', err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error'
      }));
    }
  }

  _defaultNotFoundHandler(req, res) {
    if (!res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
    }
  }

  // ─── Server Lifecycle ─────────────────────────────────────────────────────────

  listen(port, callback) {
    const { protocol = 'http', ssl } = this.options;

    if (protocol === 'https') {
      if (!ssl || !ssl.key || !ssl.cert) {
        throw new Error(
          'HTTPS requires ssl.key and ssl.cert in options.\n' +
          'Example: new Triva({ protocol: "https", ssl: { key, cert } })'
        );
      }
      this.server = https.createServer(
        { key: ssl.key, cert: ssl.cert, ...ssl.options },
        (req, res) => this._handleRequest(req, res)
      );
    } else {
      this.server = http.createServer(
        (req, res) => this._handleRequest(req, res)
      );
    }

    this.server.listen(port, () => {
      if (callback) callback();
    });

    return this.server;
  }

  close(callback) {
    if (this.server) this.server.close(callback);
    return this;
  }
}

export { TrivaServer };
