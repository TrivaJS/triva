/*!
 * Triva - Core Exports
 * Barrel export for core server functionality
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

export { RequestContext } from './request-context.js';
export { ResponseHelpers } from './response-helpers.js';
export { RouteMatcher } from './router.js';
export { TrivaServer } from './server.js';

// Re-export commonly used functions from server
import { TrivaServer } from './server.js';

let globalServer = null;

/**
 * Get a route handler
 */
function get(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.get(pattern, handler);
}

/**
 * Post a route handler
 */
function post(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.post(pattern, handler);
}

/**
 * Put a route handler
 */
function put(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.put(pattern, handler);
}

/**
 * Delete a route handler
 */
function del(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.delete(pattern, handler);
}

/**
 * Patch a route handler
 */
function patch(pattern, handler) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.patch(pattern, handler);
}

/**
 * Use middleware
 */
function use(middleware) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.use(middleware);
}

/**
 * Listen on a port
 */
function listen(port, callback) {
  if (!globalServer) {
    throw new Error('Server not initialized. Call build() first.');
  }
  return globalServer.listen(port, callback);
}

/**
 * Set global server instance
 */
function setGlobalServer(server) {
  globalServer = server;
}

export { 
  get, 
  post, 
  put, 
  del, 
  patch, 
  use, 
  listen,
  setGlobalServer
};
