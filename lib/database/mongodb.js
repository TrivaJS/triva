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

import { DatabaseAdapter } from './base-adapter.js';

class MongoDBAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      // Dynamic import of mongodb
      const { MongoClient } = await import('mongodb').catch(() => {
        throw new Error(
          '❌ MongoDB package not found.\n\n' +
          '   Install it with: npm install mongodb\n\n' +
          '   Then restart your server.'
        );
      });

      const uri = this.config.uri || this.config.url;
      if (!uri) {
        throw new Error('MongoDB URI is required in config');
      }

      this.client = new MongoClient(uri, this.config.options || {});
      await this.client.connect();

      const dbName = this.config.database || 'triva';
      this.db = this.client.db(dbName);
      this.collection = this.db.collection(this.config.collection || 'cache');

      // Create TTL index for automatic expiration
      await this.collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );

      this.connected = true;
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('✅ Disconnected from MongoDB');
    }
    return true;
  }

  async get(key) {
    const doc = await this.collection.findOne({ _id: key });
    return doc ? doc.value : null;
  }

  async set(key, value, ttl = null) {
    const doc = {
      _id: key,
      value,
      createdAt: new Date()
    };

    if (ttl) {
      doc.expiresAt = new Date(Date.now() + ttl);
    }

    await this.collection.replaceOne(
      { _id: key },
      doc,
      { upsert: true }
    );

    return true;
  }

  async delete(key) {
    const result = await this.collection.deleteOne({ _id: key });
    return result.deletedCount > 0;
  }

  async clear() {
    const result = await this.collection.deleteMany({});
    return result.deletedCount;
  }

  async keys(pattern = null) {
    const query = pattern
      ? { _id: { $regex: pattern.replace(/\*/g, '.*') } }
      : {};

    const docs = await this.collection.find(query, { projection: { _id: 1 } }).toArray();
    return docs.map(doc => doc._id);
  }

  async has(key) {
    const count = await this.collection.countDocuments({ _id: key });
    return count > 0;
  }
}

export { MongoDBAdapter };
