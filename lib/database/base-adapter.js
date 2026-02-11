/*!
 * Triva - Base Database Adapter
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

/**
 * Base class for all database adapters.
 * Provides interface that all adapters must implement.
 * 
 * @abstract
 * @class
 */
class DatabaseAdapter {
  /**
   * Creates a database adapter instance
   * 
   * @param {Object} config - Database configuration
   */
  constructor(config) {
    this.config = config;
    this.connected = false;
  }

  /**
   * Connect to database
   * 
   * @abstract
   * @async
   * @returns {Promise<boolean>} True if connected
   */
  async connect() {
    throw new Error('connect() must be implemented by adapter');
  }

  /**
   * Disconnect from database
   * 
   * @abstract
   * @async
   * @returns {Promise<boolean>} True if disconnected
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by adapter');
  }

  /**
   * Get value from cache
   * 
   * @abstract
   * @async
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or null
   */
  async get(key) {
    throw new Error('get() must be implemented by adapter');
  }

  /**
   * Set value in cache
   * 
   * @abstract
   * @async
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl] - Time to live in milliseconds
   * @returns {Promise<boolean>} True if set
   */
  async set(key, value, ttl = null) {
    throw new Error('set() must be implemented by adapter');
  }

  /**
   * Delete key from cache
   * 
   * @abstract
   * @async
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(key) {
    throw new Error('delete() must be implemented by adapter');
  }

  /**
   * Clear all keys from cache
   * 
   * @abstract
   * @async
   * @returns {Promise<number>} Number of keys cleared
   */
  async clear() {
    throw new Error('clear() must be implemented by adapter');
  }

  /**
   * Get all keys matching pattern
   * 
   * @abstract
   * @async
   * @param {string} [pattern] - Key pattern (supports wildcards)
   * @returns {Promise<Array<string>>} Array of matching keys
   */
  async keys(pattern = null) {
    throw new Error('keys() must be implemented by adapter');
  }

  /**
   * Check if key exists
   * 
   * @abstract
   * @async
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if exists
   */
  async has(key) {
    throw new Error('has() must be implemented by adapter');
  }
}

export { DatabaseAdapter };
