/*!
 * Triva - Embedded Database Adapter
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { DatabaseAdapter } from './base-adapter.js';
import fs from 'fs';
import crypto from 'crypto';

class EmbeddedAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dbPath = config.filename || './triva.db';
    this.encryptionKey = config.encryptionKey || null;
    this.data = new Map();
  }

  async connect() {
    try {
      const fs = await import('fs/promises');
      const crypto = await import('crypto');
      
      this.fs = fs;
      this.crypto = crypto;
      
      // Load existing database if it exists
      try {
        const fileContent = await fs.readFile(this.dbPath, 'utf8');
        
        if (this.encryptionKey) {
          // Decrypt data
          const decrypted = this._decrypt(fileContent);
          const parsed = JSON.parse(decrypted);
          this.data = new Map(Object.entries(parsed));
        } else {
          const parsed = JSON.parse(fileContent);
          this.data = new Map(Object.entries(parsed));
        }
      } catch (err) {
        // Database file doesn't exist or is empty, start fresh
        this.data = new Map();
      }
      
      this.connected = true;
      console.log(`✅ Connected to Embedded database at ${this.dbPath}`);
      return true;
    } catch (error) {
      console.error('❌ Embedded database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this._persist();
    this.connected = false;
    console.log('✅ Disconnected from Embedded database');
    return true;
  }

  async get(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.data.delete(key);
      await this._persist();
      return null;
    }
    
    return entry.value;
  }

  async set(key, value, ttl = null) {
    const entry = {
      value: value,
      expiresAt: ttl ? Date.now() + ttl : null
    };
    
    this.data.set(key, entry);
    await this._persist();
    return true;
  }

  async delete(key) {
    const result = this.data.delete(key);
    if (result) {
      await this._persist();
    }
    return result;
  }

  async clear() {
    const count = this.data.size;
    this.data.clear();
    await this._persist();
    return count;
  }

  async keys(pattern = null) {
    const allKeys = Array.from(this.data.keys());
    
    if (!pattern) return allKeys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async has(key) {
    return this.data.has(key);
  }

  async _persist() {
    try {
      // Convert Map to plain object
      const obj = Object.fromEntries(this.data);
      let content = JSON.stringify(obj, null, 2);
      
      // Encrypt if key is provided
      if (this.encryptionKey) {
        content = this._encrypt(content);
      }
      
      await this.fs.writeFile(this.dbPath, content, 'utf8');
    } catch (error) {
      console.error('❌ Failed to persist database:', error.message);
    }
  }

  _encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = this.crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = this.crypto.randomBytes(16);
    
    const cipher = this.crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  _decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = this.crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    
    const decipher = this.crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export { EmbeddedAdapter };
