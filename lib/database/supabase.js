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

class SupabaseAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.tableName = config.tableName || 'triva_cache';
  }

  async connect() {
    try {
      // Dynamic import with helpful error
      let createClient;
      try {
        const supabase = await import('@supabase/supabase-js');
        createClient = supabase.createClient;
      } catch (err) {
        throw new Error(
          '❌ Supabase package not found\n\n' +
          '   Install with: npm install @supabase/supabase-js\n' +
          '   Documentation: https://supabase.com/docs/reference/javascript/installing\n'
        );
      }

      // Validate required config
      if (!this.config.url || !this.config.key) {
        throw new Error(
          '❌ Supabase requires url and key\n\n' +
          '   Example:\n' +
          '   cache: {\n' +
          '     type: "supabase",\n' +
          '     database: {\n' +
          '       url: "https://xxx.supabase.co",\n' +
          '       key: "your-anon-key"\n' +
          '     }\n' +
          '   }\n'
        );
      }

      // Create Supabase client
      this.client = createClient(this.config.url, this.config.key, this.config.options || {});

      // Create table if not exists using SQL
      const { error } = await this.client.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            expires_at TIMESTAMPTZ
          );

          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at
          ON ${this.tableName} (expires_at);
        `
      });

      // If exec_sql doesn't exist, try direct query (for newer Supabase)
      if (error && error.message.includes('exec_sql')) {
        // Table might already exist, or we need to create it manually
        // For Supabase, users should create table via Dashboard or migrations
        console.log('⚠️  Supabase table setup: Create table via Dashboard or SQL Editor:');
        console.log(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            expires_at TIMESTAMPTZ
          );

          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at
          ON ${this.tableName} (expires_at);
        `);
      }

      this.connected = true;
      console.log('✅ Connected to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    // Supabase client doesn't need explicit disconnect
    this.connected = false;
    console.log('✅ Disconnected from Supabase');
    return true;
  }

  async get(key) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('value')
      .eq('key', key)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data?.value || null;
  }

  async set(key, value, ttl = null) {
    const expiresAt = ttl ? new Date(Date.now() + ttl).toISOString() : null;

    const { error } = await this.client
      .from(this.tableName)
      .upsert({
        key: key,
        value: value,
        expires_at: expiresAt
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
    return true;
  }

  async delete(key) {
    const { error, count } = await this.client
      .from(this.tableName)
      .delete({ count: 'exact' })
      .eq('key', key);

    if (error) throw error;
    return count > 0;
  }

  async clear() {
    const { error, count } = await this.client
      .from(this.tableName)
      .delete({ count: 'exact' })
      .neq('key', ''); // Delete all (key is always non-empty)

    if (error) throw error;
    return count;
  }

  async keys(pattern = null) {
    let query = this.client
      .from(this.tableName)
      .select('key');

    if (pattern) {
      // Convert glob pattern to PostgreSQL regex
      const regex = '^' + pattern.replace(/\*/g, '.*') + '$';
      query = query.filter('key', 'match', regex);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(row => row.key);
  }

  async has(key) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('key', { count: 'exact', head: true })
      .eq('key', key)
      .limit(1);

    if (error) throw error;
    return data !== null;
  }
}

export { SupabaseAdapter };
