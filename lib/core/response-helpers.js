/*!
 * Triva - Response Helpers
 * Enhanced response object with chainable methods
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { createReadStream, stat } from 'fs';
import { basename, extname } from 'path';
import { parse as parseUrl } from 'url';

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

export { ResponseHelpers };
