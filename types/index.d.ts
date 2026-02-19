// Triva Type Definitions
// Copyright (c) 2026 Kris Powers — MIT License

import { IncomingMessage, ServerResponse, Server } from 'http';

// ─── Server Options ───────────────────────────────────────────────────────────

export interface ServerOptions {
  /** Runtime environment. Affects error detail in responses. Default: 'production' */
  env?: 'development' | 'production';

  /** Server protocol. Default: 'http' */
  protocol?: 'http' | 'https';

  /** Required when protocol is 'https' */
  ssl?: {
    key: Buffer | string;
    cert: Buffer | string;
    /** Any additional options passed to https.createServer() */
    options?: object;
  };

  /** Cache / database configuration */
  cache?: CacheOptions;

  /** Rate limiting / throttle configuration */
  throttle?: ThrottleOptions;

  /**
   * Log retention configuration.
   * Controls how many log entries are kept in memory.
   */
  retention?: RetentionOptions;

  /** Error tracking configuration */
  errorTracking?: ErrorTrackingOptions | boolean;

  /** Combined middleware options (alternative to top-level throttle/retention) */
  middleware?: {
    throttle?: ThrottleOptions;
    retention?: RetentionOptions;
  };
}

// ─── Cache / Database Options ─────────────────────────────────────────────────

export interface CacheOptions {
  /**
   * Adapter type.
   * Built-in (no install): 'memory' | 'embedded'
   * Requires install:      'redis' | 'mongodb' | 'postgresql' | 'postgres' | 'pg' |
   *                        'mysql' | 'sqlite' | 'sqlite3' | 'better-sqlite3' | 'supabase'
   * Default: 'memory'
   */
  type?: string;

  /**
   * Default TTL for cache entries in milliseconds.
   * Default: 600000 (10 minutes)
   */
  retention?: number;

  /**
   * Maximum number of cache entries (memory adapter).
   * Default: 100000
   */
  limit?: number;

  /**
   * Disable caching entirely.
   * Default: true (caching enabled)
   */
  cache_data?: boolean;

  // ── Redis ─────────────────────────────────────────────────────────────────
  /** Redis connection URL. e.g. 'redis://localhost:6379' */
  url?: string;

  // ── MongoDB ───────────────────────────────────────────────────────────────
  /** MongoDB connection URI. e.g. 'mongodb://localhost:27017/myapp' */
  uri?: string;
  /** MongoDB database name. Default: 'triva' */
  database?: string;
  /** MongoDB collection name. Default: 'cache' */
  collection?: string;

  // ── PostgreSQL / MySQL (pool config passed directly to driver) ────────────
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  /** Table name for SQL adapters. Default: 'triva_cache' */
  tableName?: string;

  // ── SQLite / Better-SQLite3 / Embedded ────────────────────────────────────
  /** Path to the database file. Default: './triva.sqlite' (sqlite) or './cache.json' (embedded) */
  filename?: string;

  // ── Supabase ──────────────────────────────────────────────────────────────
  /** Supabase project URL */
  key?: string;
}

// ─── Throttle Options ─────────────────────────────────────────────────────────

export interface ThrottleOptions {
  /**
   * Maximum requests allowed per window per IP+UA combination.
   * Required.
   */
  limit: number;

  /**
   * Sliding window duration in milliseconds.
   * Required. e.g. 60000 (1 minute)
   */
  window_ms: number;

  /**
   * Maximum requests allowed in a short burst window.
   * Default: 20
   */
  burst_limit?: number;

  /**
   * Duration of the burst window in milliseconds.
   * Default: 1000 (1 second)
   */
  burst_window_ms?: number;

  /**
   * Number of violations before an IP is auto-banned.
   * Default: 5
   */
  ban_threshold?: number;

  /**
   * How long a ban lasts in milliseconds.
   * Default: 86400000 (24 hours)
   */
  ban_ms?: number;

  /**
   * How long before a violation decays in milliseconds.
   * Default: 3600000 (1 hour)
   */
  violation_decay_ms?: number;

  /**
   * How many different User-Agents from one IP trigger UA-rotation detection.
   * Default: 5
   */
  ua_rotation_threshold?: number;

  /**
   * Cache namespace prefix for throttle keys.
   * Default: 'throttle'
   */
  namespace?: string;

  /**
   * Dynamic policy function. Receives the full request object so you can
   * apply tiered limits based on headers, URL, auth tokens, API keys, etc.
   * Return a partial ThrottleOptions object to override the base config for
   * this specific request. Return null/undefined to use base config.
   *
   * @example
   * policies: ({ ip, ua, context }) => {
   *   // context is the full req object
   *   if (context.headers['x-api-key'] === 'premium') {
   *     return { limit: 10000, window_ms: 60000 };
   *   }
   *   if (context.url.startsWith('/api/public')) {
   *     return { limit: 30, window_ms: 60000 };
   *   }
   *   return null; // use base config
   * }
   */
  policies?: (context: { ip: string; ua: string; context: RequestContext }) => Partial<ThrottleOptions> | null;
}

// ─── Retention Options ────────────────────────────────────────────────────────

export interface RetentionOptions {
  /** Enable log retention. Default: true */
  enabled?: boolean;
  /** Maximum number of log entries to keep in memory. Default: 100000 */
  maxEntries?: number;
}

// ─── Error Tracking Options ───────────────────────────────────────────────────

export interface ErrorTrackingOptions {
  enabled?: boolean;
}

// ─── Cookie Options ───────────────────────────────────────────────────────────

export interface CookieOptions {
  maxAge?: number;
  expires?: Date | string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None' | boolean;
  path?: string;
  domain?: string;
}

export interface SendFileOptions {
  contentType?: string;
  headers?: Record<string, string>;
}

// ─── Request / Response ───────────────────────────────────────────────────────

export interface ResponseHelpers extends ServerResponse {
  status(code: number): this;
  header(name: string, value: string): this;
  json(data: any): this;
  send(data: any): this;
  html(html: string): this;
  redirect(url: string, code?: number): this;
  jsonp(data: any, callbackParam?: string): this;
  download(filepath: string, filename?: string): this;
  sendFile(filepath: string, options?: SendFileOptions): this;
  render(view: string, locals?: object, callback?: (err: Error | null, html?: string) => void): this;
  cookie(name: string, value: string, options?: CookieOptions): this;
  clearCookie(name: string, options?: CookieOptions): this;
  end(data?: any): this;
}

export interface RequestContext extends IncomingMessage {
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  pathname: string;
  cookies: Record<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
}

export type RouteHandler = (
  req: RequestContext,
  res: ResponseHelpers,
  next?: (err?: Error) => void
) => void | Promise<void>;

export type MiddlewareFunction = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: Error) => void
) => void;

export type EngineFunction = (
  filePath: string,
  options: object,
  callback: (err: Error | null, html?: string) => void
) => void;

// ─── RouteBuilder ─────────────────────────────────────────────────────────────

export interface RouteBuilder {
  get(...handlers: Array<RouteHandler | RouteHandler[]>): this;
  post(...handlers: Array<RouteHandler | RouteHandler[]>): this;
  put(...handlers: Array<RouteHandler | RouteHandler[]>): this;
  del(...handlers: Array<RouteHandler | RouteHandler[]>): this;
  patch(...handlers: Array<RouteHandler | RouteHandler[]>): this;
  all(...handlers: Array<RouteHandler | RouteHandler[]>): this;
}

// ─── build class ─────────────────────────────────────────────────────────────

/**
 * build — Triva application class.
 *
 * @example
 * import { build } from 'triva';
 *
 * const app = new build({ env: 'development' });
 *
 * app.get('/', (req, res) => res.json({ hello: 'world' }));
 * app.listen(3000);
 *
 * @example
 * // Multiple independent instances
 * const api   = new build({ env: 'production' });
 * const admin = new build({ env: 'production' });
 * api.listen(3000);
 * admin.listen(4000);
 */
export class build {
  constructor(options?: ServerOptions);

  // Settings API
  set(key: string, value: any): this;
  get(key: string): any;
  enable(key: string): this;
  disable(key: string): this;
  enabled(key: string): boolean;
  disabled(key: string): boolean;

  // Template engine
  engine(ext: string, fn: EngineFunction): this;

  // Routing
  get(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  post(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  put(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  del(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  delete(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  patch(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  all(pattern: string, ...handlers: Array<RouteHandler | RouteHandler[]>): this;
  route(path: string): RouteBuilder;

  // Middleware
  use(middleware: MiddlewareFunction): this;
  setErrorHandler(handler: (err: Error, req: IncomingMessage, res: ServerResponse) => void): this;
  setNotFoundHandler(handler: (req: IncomingMessage, res: ServerResponse) => void): this;

  // Lifecycle
  listen(port: number, callback?: () => void): Server;
  close(callback?: () => void): this;
}

export { build as default };

// ─── Standalone exports ───────────────────────────────────────────────────────

export const log: {
  get(filter?: {
    method?: string | string[];
    status?: number | number[];
    ip?: string;
    pathname?: string;
    from?: number | string;
    to?: number | string;
    throttled?: boolean;
    limit?: number;
  }): Promise<any[]>;
  getStats(): Promise<any>;
  clear(): Promise<{ cleared: number }>;
  search(query: string): Promise<any[]>;
  export(filter?: any, filename?: string): Promise<{ success: boolean; filename: string; filepath: string; count: number }>;
};

export const cache: {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean | number>;
  has(key: string): Promise<boolean>;
  clear(): Promise<number>;
  keys(pattern?: string): Promise<string[]>;
  stats(): Promise<any>;
};

export const errorTracker: {
  configure(options: any): any;
  capture(error: Error, context?: any): Promise<any>;
  get(filter?: any): Promise<any[]>;
  getById(id: string): Promise<any>;
  resolve(id: string): Promise<any>;
  getStats(): Promise<any>;
  clear(): Promise<any>;
};

export function configCache(options: CacheOptions): Promise<void>;
export function cookieParser(secret?: string): MiddlewareFunction;
export function createAdapter(type: string, config?: object): any;
