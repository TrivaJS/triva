/*!
 * Triva - Error Tracking System
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { parseUA } from './ua-parser.js';

/* ---------------- Error Entry Structure ---------------- */
class ErrorEntry {
  constructor(error, context = {}) {
    this.id = this._generateId();
    this.timestamp = Date.now();
    this.datetime = new Date().toISOString();
    
    // Error details
    this.error = {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack || null,
      code: error.code || null,
      type: this._classifyError(error)
    };

    // Request context (if available)
    this.request = {
      method: context.req?.method || null,
      url: context.req?.url || null,
      pathname: context.pathname || null,
      ip: context.req?.socket?.remoteAddress || context.req?.connection?.remoteAddress || null,
      userAgent: context.req?.headers?.['user-agent'] || null,
      headers: context.req ? this._sanitizeHeaders(context.req.headers) : null
    };

    // User agent data (if available)
    this.uaData = context.uaData || null;

    // Additional context
    this.context = {
      route: context.route || null,
      handler: context.handler || null,
      phase: context.phase || null, // 'middleware', 'route', 'error-handler', etc.
      custom: context.custom || {}
    };

    // System info
    this.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Error severity
    this.severity = this._determineSeverity(error, context);
    
    // Resolution status
    this.status = 'unresolved';
    this.resolved = false;
    this.resolvedAt = null;
  }

  _generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // Remove sensitive headers
    const sensitive = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    sensitive.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  _classifyError(error) {
    if (error.name === 'TypeError') return 'type-error';
    if (error.name === 'ReferenceError') return 'reference-error';
    if (error.name === 'SyntaxError') return 'syntax-error';
    if (error.code === 'ENOENT') return 'file-not-found';
    if (error.code === 'ECONNREFUSED') return 'connection-refused';
    if (error.code === 'ETIMEDOUT') return 'timeout';
    if (error.message?.includes('JSON')) return 'json-parse-error';
    if (error.message?.includes('permission')) return 'permission-error';
    return 'general';
  }

  _determineSeverity(error, context) {
    // Critical: System errors, crashes
    if (error.name === 'Error' && error.message.includes('FATAL')) return 'critical';
    if (error.code === 'ERR_OUT_OF_MEMORY') return 'critical';
    
    // High: Unhandled errors, type errors in handlers
    if (context.phase === 'uncaught') return 'high';
    if (error.name === 'TypeError' || error.name === 'ReferenceError') return 'high';
    
    // Medium: Route handler errors, middleware errors
    if (context.phase === 'route' || context.phase === 'middleware') return 'medium';
    
    // Low: Validation errors, expected errors
    if (error.name === 'ValidationError') return 'low';
    if (error.message?.includes('Invalid')) return 'low';
    
    return 'medium';
  }

  markResolved() {
    this.resolved = true;
    this.status = 'resolved';
    this.resolvedAt = new Date().toISOString();
    return this;
  }
}

/* ---------------- Error Storage & Analytics ---------------- */
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.config = {
      enabled: true,
      maxEntries: 10000,
      captureStackTrace: true,
      captureContext: true,
      captureSystemInfo: true
    };
    this.stats = {
      total: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {},
      byPhase: {},
      resolved: 0,
      unresolved: 0
    };

    // Hook into process-level error handlers
    this._setupGlobalHandlers();
  }

  configure(options = {}) {
    this.config = {
      ...this.config,
      enabled: options.enabled !== false,
      maxEntries: options.maxEntries || this.config.maxEntries,
      captureStackTrace: options.captureStackTrace !== false,
      captureContext: options.captureContext !== false,
      captureSystemInfo: options.captureSystemInfo !== false
    };
    return this;
  }

  async capture(error, context = {}) {
    if (!this.config.enabled) return null;

    // Parse UA if available and not already parsed
    if (context.req && !context.uaData) {
      const ua = context.req.headers?.['user-agent'];
      if (ua) {
        try {
          context.uaData = await parseUA(ua);
        } catch (err) {
          // Silently fail UA parsing
        }
      }
    }

    const entry = new ErrorEntry(error, context);

    // Update stats
    this.stats.total++;
    this.stats.bySeverity[entry.severity]++;
    this.stats.byType[entry.error.type] = (this.stats.byType[entry.error.type] || 0) + 1;
    if (entry.context.phase) {
      this.stats.byPhase[entry.context.phase] = (this.stats.byPhase[entry.context.phase] || 0) + 1;
    }
    this.stats.unresolved++;

    // Add to storage
    this.errors.push(entry);
    this._enforceRetention();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Error Tracker] ${entry.severity.toUpperCase()}: ${entry.error.message}`);
      if (entry.request.url) {
        console.error(`  Request: ${entry.request.method} ${entry.request.url}`);
      }
      if (this.config.captureStackTrace && entry.error.stack) {
        console.error(`  Stack: ${entry.error.stack.split('\n')[1]?.trim()}`);
      }
    }

    return entry;
  }

  _enforceRetention() {
    if (this.errors.length > this.config.maxEntries) {
      const toRemove = this.errors.length - this.config.maxEntries;
      this.errors.splice(0, toRemove);
    }
  }

  async get(filter = {}) {
    if (filter === 'all') {
      return this.errors;
    }

    let results = [...this.errors];

    // Filter by severity
    if (filter.severity) {
      const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
      results = results.filter(e => severities.includes(e.severity));
    }

    // Filter by type
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      results = results.filter(e => types.includes(e.error.type));
    }

    // Filter by phase
    if (filter.phase) {
      results = results.filter(e => e.context.phase === filter.phase);
    }

    // Filter by resolved status
    if (filter.resolved !== undefined) {
      results = results.filter(e => e.resolved === filter.resolved);
    }

    // Filter by time range
    if (filter.from) {
      const fromTime = typeof filter.from === 'number' ? filter.from : new Date(filter.from).getTime();
      results = results.filter(e => e.timestamp >= fromTime);
    }

    if (filter.to) {
      const toTime = typeof filter.to === 'number' ? filter.to : new Date(filter.to).getTime();
      results = results.filter(e => e.timestamp <= toTime);
    }

    // Search in error messages
    if (filter.search) {
      const search = filter.search.toLowerCase();
      results = results.filter(e => 
        e.error.message.toLowerCase().includes(search) ||
        e.error.name.toLowerCase().includes(search) ||
        e.request.url?.toLowerCase().includes(search)
      );
    }

    // Limit results
    if (filter.limit) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  async getById(id) {
    return this.errors.find(e => e.id === id);
  }

  async resolve(id) {
    const error = await this.getById(id);
    if (error && !error.resolved) {
      error.markResolved();
      this.stats.resolved++;
      this.stats.unresolved--;
      return error;
    }
    return null;
  }

  async getStats() {
    const recent = this.errors.slice(-1000);

    return {
      total: this.stats.total,
      stored: this.errors.length,
      severity: this.stats.bySeverity,
      types: this.stats.byType,
      phases: this.stats.byPhase,
      resolved: this.stats.resolved,
      unresolved: this.stats.unresolved,
      recent: {
        count: recent.length,
        critical: recent.filter(e => e.severity === 'critical').length,
        high: recent.filter(e => e.severity === 'high').length,
        medium: recent.filter(e => e.severity === 'medium').length,
        low: recent.filter(e => e.severity === 'low').length
      }
    };
  }

  async clear() {
    const count = this.errors.length;
    this.errors = [];
    this.stats = {
      total: this.stats.total, // Keep total count
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byType: {},
      byPhase: {},
      resolved: 0,
      unresolved: 0
    };
    return { cleared: count };
  }

  _setupGlobalHandlers() {
    // Capture uncaught exceptions
    process.on('uncaughtException', (error, origin) => {
      this.capture(error, {
        phase: 'uncaught',
        custom: { origin }
      }).catch(() => {}); // Silently fail to prevent recursion
    });

    // Capture unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.capture(error, {
        phase: 'unhandled-rejection',
        custom: { promise: String(promise) }
      }).catch(() => {});
    });

    // Capture warnings
    process.on('warning', (warning) => {
      if (warning.name !== 'DeprecationWarning') { // Skip deprecation warnings
        this.capture(warning, {
          phase: 'warning',
          custom: { warningType: warning.name }
        }).catch(() => {});
      }
    });
  }
}

/* ---------------- Export Singleton ---------------- */
const errorTracker = new ErrorTracker();

export { errorTracker, ErrorEntry };
