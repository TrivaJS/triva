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

import { parse as parseUrl } from 'url';


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

export { RequestContext };
