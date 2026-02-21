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

import { createReadStream, stat  } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { parse as parseUrl } from 'url';

class ResponseHelpers {
  /**
   * @param {http.ServerResponse} res
   * @param {TrivaServer} [server] - Server instance, used for render() engine lookup
   */
  constructor(res, server = null) {
    this.res    = res;
    this.server = server;
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
    if (this.res.writableEnded) return this;
    if (typeof data === 'object') return this.json(data);
    const str = String(data);
    if (str.trim().startsWith('<') && (str.includes('</') || str.includes('/>'))) {
      this.res.setHeader('Content-Type', 'text/html');
    } else {
      this.res.setHeader('Content-Type', 'text/plain');
    }
    this.res.end(str);
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
    if (this.res.writableEnded) return this;
    const parsedUrl = parseUrl(this.res.req?.url || '', true);
    const callback  = parsedUrl.query[callbackParam] || 'callback';
    const safe      = callback.replace(/[^\[\]\w$.]/g, '');
    const body      = `/**/ typeof ${safe} === 'function' && ${safe}(${JSON.stringify(data)});`;
    this.res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    this.res.setHeader('X-Content-Type-Options', 'nosniff');
    this.res.end(body);
    return this;
  }

  download(filepath, filename = null) {
    if (this.res.writableEnded) return this;
    const name = filename || basename(filepath);
    stat(filepath, (err, stats) => {
      if (err) { this.res.statusCode = 404; this.res.end('File not found'); return; }
      this.res.setHeader('Content-Type', 'application/octet-stream');
      this.res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
      this.res.setHeader('Content-Length', stats.size);
      createReadStream(filepath).pipe(this.res);
    });
    return this;
  }

  sendFile(filepath, options = {}) {
    if (this.res.writableEnded) return this;
    stat(filepath, (err, stats) => {
      if (err) { this.res.statusCode = 404; this.res.end('File not found'); return; }
      const ext = extname(filepath).toLowerCase();
      const types = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml'
      };
      const contentType = options.contentType || types[ext] || 'application/octet-stream';
      this.res.setHeader('Content-Type', contentType);
      this.res.setHeader('Content-Length', stats.size);
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => this.res.setHeader(k, v));
      }
      createReadStream(filepath).pipe(this.res);
    });
    return this;
  }

  /**
   * Render a view template and send the result as an HTML response.
   *
   * Resolution order:
   *  1. Look up the registered engine for the view's extension (or app.get('view engine')).
   *  2. Resolve the file path from app.get('views') directory.
   *  3. Call engine(filePath, options, callback) and send the output.
   *
   * @param {string} view    - Template name (e.g. 'index' or 'index.ejs')
   * @param {Object} [locals={}] - Data passed to the template
   * @param {Function} [callback] - Optional callback(err, html) — if omitted, sends response
   *
   * @example
   * // Using EJS
   * app.engine('ejs', require('ejs').renderFile);
   * app.set('view engine', 'ejs');
   * app.set('views', './views');
   *
   * app.get('/', (req, res) => {
   *   res.render('index', { title: 'Home', message: 'Hello World' });
   * });
   *
   * @example
   * // Custom engine
   * app.engine('ntl', (filePath, options, callback) => {
   *   fs.readFile(filePath, (err, content) => {
   *     if (err) return callback(err);
   *     const rendered = content.toString().replace('#title#', options.title);
   *     return callback(null, rendered);
   *   });
   * });
   */
  render(view, locals = {}, callback = null) {
    if (!this.server) {
      const err = new Error('res.render() requires a server instance with a registered engine');
      if (callback) return callback(err);
      this.res.statusCode = 500;
      this.res.end(err.message);
      return this;
    }

    const viewsDir   = this.server._settings['views'] || resolve('./views');
    const defaultExt = this.server._settings['view engine'];

    // Determine file extension
    let viewFile = view;
    let ext = extname(view);

    if (!ext) {
      if (!defaultExt) {
        const err = new Error(`No default view engine set. Use app.set('view engine', 'ejs') or include the extension in the view name.`);
        if (callback) return callback(err);
        this.res.statusCode = 500;
        return this.res.end(err.message);
      }
      ext = defaultExt.startsWith('.') ? defaultExt : `.${defaultExt}`;
      viewFile = view + ext;
    }

    const filePath = join(viewsDir, viewFile);
    const engine   = this.server._engines[ext];

    if (!engine) {
      const err = new Error(`No engine registered for extension "${ext}". Use app.engine('${ext.slice(1)}', fn).`);
      if (callback) return callback(err);
      this.res.statusCode = 500;
      return this.res.end(err.message);
    }

    engine(filePath, locals, (err, html) => {
      if (err) {
        if (callback) return callback(err);
        this.res.statusCode = 500;
        return this.res.end(`Render error: ${err.message}`);
      }
      if (callback) return callback(null, html);
      if (!this.res.writableEnded) {
        this.res.setHeader('Content-Type', 'text/html');
        this.res.end(html);
      }
    });

    return this;
  }

  end(data) {
    if (!this.res.writableEnded) this.res.end(data);
    return this;
  }
}

export { ResponseHelpers };
