/*!
 * Triva - HTTP/HTTPS Server
 * Main server class with routing and middleware
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import http from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
import { RequestContext } from './request-context.js';
import { ResponseHelpers } from './response-helpers.js';
import { RouteMatcher } from './router.js';
import { errorTracker } from '../middleware/error-tracker.js';

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

      // Create enhanced request with context methods
      const context = new RequestContext(req, res, match.params);

      // Copy context methods to req
      req.params = context.params;
      req.query = context.query;
      req.pathname = context.pathname;
      req.json = context.json.bind(context);
      req.text = context.text.bind(context);

      // Execute route handler with error tracking
      try {
        await match.handler(req, res);
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


export { TrivaServer };
