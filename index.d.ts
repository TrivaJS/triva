// Triva Type Definitions
import { IncomingMessage, ServerResponse } from 'http';

export interface ServerOptions {
  env?: 'development' | 'production';
}

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
  cookie(name: string, value: string, options?: CookieOptions): this;
  clearCookie(name: string, options?: CookieOptions): this;
}

export interface RequestContext {
  req: IncomingMessage;
  res: ResponseHelpers;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  pathname: string;
  cookies: Record<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
}

export type RouteHandler = (req: RequestContext, res: ResponseHelpers) => void | Promise<void>;
export type MiddlewareFunction = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => void;

export function build(options?: ServerOptions): void;
export function middleware(options?: any): void;
export function use(middleware: MiddlewareFunction): void;
export function get(pattern: string, handler: RouteHandler): void;
export function post(pattern: string, handler: RouteHandler): void;
export function put(pattern: string, handler: RouteHandler): void;
export function patch(pattern: string, handler: RouteHandler): void;
export { del as delete };
export function del(pattern: string, handler: RouteHandler): void;
export function listen(port: number, callback?: () => void): any;
export function setErrorHandler(handler: (err: Error, req: IncomingMessage, res: ServerResponse) => void): void;
export function setNotFoundHandler(handler: (req: IncomingMessage, res: ServerResponse) => void): void;

export const log: {
  get(filter?: any): Promise<any[]>;
  getStats(): Promise<any>;
  clear(): Promise<any>;
  search(query: string): Promise<any[]>;
  export(filter?: any, filename?: string): Promise<any>;
};

export const cache: {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<number>;
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

export function configCache(options: any): void;
export function cookieParser(secret?: string): MiddlewareFunction;
