/*!
 * Triva - Logging System
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { parse as parseUrl } from 'url';
import { parseUA } from './ua-parser.js';
import { parseCookies } from './cookie-parser.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/* ---------------- Log Entry Structure ---------------- */
class LogEntry {
  constructor(req) {
    const parsedUrl = parseUrl(req.url, true);
    
    this.timestamp = Date.now();
    this.datetime = new Date().toISOString();
    this.method = req.method;
    this.url = req.url;
    this.pathname = parsedUrl.pathname;
    this.query = parsedUrl.query || {};
    this.headers = { ...req.headers };
    this.ip = req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
    this.userAgent = req.headers['user-agent'] || 'unknown';
    
    // Parse and include cookies
    this.cookies = req.cookies || parseCookies(req.headers.cookie);
    
    this.statusCode = null;
    this.responseTime = null;
    this.throttle = req.triva?.throttle || null;
    
    // Include parsed UA data from throttle if available, otherwise null
    // Will be populated by LogStorage.push() if not present
    this.uaData = req.triva?.throttle?.uaData || null;
    
    this.metadata = {};
  }

  setResponse(statusCode, responseTime) {
    this.statusCode = statusCode;
    this.responseTime = responseTime;
    return this;
  }

  addMetadata(key, value) {
    this.metadata[key] = value;
    return this;
  }
}

/* ---------------- Log Storage ---------------- */
class LogStorage {
  constructor() {
    this.entries = [];
    this.retention = {
      enabled: true,
      maxEntries: 100000
    };
    this.stats = {
      total: 0,
      evicted: 0,
      methods: {},
      statusCodes: {}
    };
  }

  _setRetention(config) {
    this.retention = {
      enabled: Boolean(config.enabled),
      maxEntries: Number(config.maxEntries) || 100000
    };
  }

  _enforceRetention() {
    if (!this.retention.enabled) return;

    if (this.entries.length > this.retention.maxEntries) {
      const toRemove = this.entries.length - this.retention.maxEntries;
      this.entries.splice(0, toRemove);
      this.stats.evicted += toRemove;
    }
  }

  async push(req) {
    const entry = new LogEntry(req);
    
    // Parse UA data if not already available from throttle
    if (!entry.uaData && entry.userAgent && entry.userAgent !== 'unknown') {
      entry.uaData = await parseUA(entry.userAgent);
    }
    
    // Update stats
    this.stats.total++;
    this.stats.methods[entry.method] = (this.stats.methods[entry.method] || 0) + 1;
    
    this.entries.push(entry);
    this._enforceRetention();
    
    return entry;
  }

  async get(filter = {}) {
    if (filter === 'all' || filter.all) {
      return this.entries;
    }

    let results = [...this.entries];

    // Filter by method
    if (filter.method) {
      const methods = Array.isArray(filter.method) ? filter.method : [filter.method];
      results = results.filter(e => methods.includes(e.method));
    }

    // Filter by status code
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      results = results.filter(e => e.statusCode && statuses.includes(e.statusCode));
    }

    // Filter by IP
    if (filter.ip) {
      results = results.filter(e => e.ip === filter.ip);
    }

    // Filter by pathname pattern
    if (filter.pathname) {
      const pattern = new RegExp(filter.pathname);
      results = results.filter(e => pattern.test(e.pathname));
    }

    // Filter by date range
    if (filter.from) {
      const fromTime = typeof filter.from === 'number' ? filter.from : new Date(filter.from).getTime();
      results = results.filter(e => e.timestamp >= fromTime);
    }

    if (filter.to) {
      const toTime = typeof filter.to === 'number' ? filter.to : new Date(filter.to).getTime();
      results = results.filter(e => e.timestamp <= toTime);
    }

    // Filter by throttle status
    if (filter.throttled !== undefined) {
      results = results.filter(e => {
        if (!e.throttle) return false;
        return filter.throttled ? e.throttle.restricted : !e.throttle.restricted;
      });
    }

    // Limit results
    if (filter.limit) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  async getStats() {
    const recent = this.entries.slice(-1000);
    
    const statusCodeDist = {};
    const methodDist = {};
    const throttledCount = recent.filter(e => e.throttle?.restricted).length;
    
    recent.forEach(entry => {
      if (entry.statusCode) {
        statusCodeDist[entry.statusCode] = (statusCodeDist[entry.statusCode] || 0) + 1;
      }
      methodDist[entry.method] = (methodDist[entry.method] || 0) + 1;
    });

    const responseTimes = recent
      .filter(e => e.responseTime !== null)
      .map(e => e.responseTime);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      total: this.stats.total,
      stored: this.entries.length,
      evicted: this.stats.evicted,
      retention: this.retention,
      recent: {
        count: recent.length,
        throttled: throttledCount,
        throttleRate: recent.length > 0 ? (throttledCount / recent.length) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        statusCodes: statusCodeDist,
        methods: methodDist
      }
    };
  }

  async clear() {
    const count = this.entries.length;
    this.entries = [];
    return { cleared: count };
  }

  async search(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.entries.filter(entry => {
      return (
        entry.pathname.toLowerCase().includes(lowerQuery) ||
        entry.url.toLowerCase().includes(lowerQuery) ||
        entry.userAgent.toLowerCase().includes(lowerQuery) ||
        entry.ip.includes(query) ||
        entry.method.toLowerCase().includes(lowerQuery)
      );
    });
  }

  async export(filter = 'all', filename = null) {
    // Get logs based on filter
    const logsToExport = filter === 'all' || !filter ? this.entries : await this.get(filter);
    
    // Generate filename if not provided
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `triva-logs-${timestamp}.json`;
    }
    
    // Ensure .json extension
    if (!filename.endsWith('.json')) {
      filename += '.json';
    }
    
    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logsToExport.length,
      filter: typeof filter === 'object' ? filter : { type: filter },
      logs: logsToExport
    };
    
    // Write to file in current working directory
    const filepath = join(process.cwd(), filename);
    await writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    return {
      success: true,
      filename,
      filepath,
      count: logsToExport.length
    };
  }
}

/* ---------------- Export Singleton ---------------- */
const log = new LogStorage();

export { log, LogEntry };
