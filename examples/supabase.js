/**
 * Supabase Database Example
 * 
 * Prerequisites:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Create a Supabase project at https://supabase.com
 * 3. Create the cache table (see SQL below)
 * 4. Get your URL and anon key from project settings
 */

import { build, get, post, listen } from '../lib/index.js';

// SQL to run in Supabase SQL Editor (Dashboard > SQL Editor):
/*
CREATE TABLE IF NOT EXISTS triva_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_triva_cache_expires_at 
ON triva_cache (expires_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE triva_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations" ON triva_cache
FOR ALL USING (true);
*/

async function startSupabaseServer() {
  await build({
    env: 'production',
    
    // Supabase database configuration
    cache: {
      type: 'supabase',
      retention: 3600000, // 1 hour default TTL
      
      database: {
        url: process.env.SUPABASE_URL || 'https://xxxxxxxxxxxxx.supabase.co',
        key: process.env.SUPABASE_KEY || 'your-anon-key-here',
        
        // Optional: Custom table name (default: 'triva_cache')
        tableName: 'triva_cache',
        
        // Optional: Supabase client options
        options: {
          auth: {
            persistSession: false
          },
          db: {
            schema: 'public'
          }
        }
      }
    },
    
    // Optional: Throttling
    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  // Example routes
  get('/', (req, res) => {
    res.json({
      message: 'Triva with Supabase',
      database: 'supabase',
      cache: 'enabled'
    });
  });

  // Cached endpoint
  get('/api/users', async (req, res) => {
    // This will be cached in Supabase
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ];
    
    res.json({ users, cached: true });
  });

  // Create user (bypasses cache)
  post('/api/users', async (req, res) => {
    const user = await req.json();
    
    // In real app, save to database here
    
    res.status(201).json({
      message: 'User created',
      user
    });
  });

  // Health check
  get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: 'supabase',
      uptime: process.uptime()
    });
  });

  listen(3000);
}

// Environment variables check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.log('⚠️  Environment variables not set:');
  console.log('   SUPABASE_URL - Your Supabase project URL');
  console.log('   SUPABASE_KEY - Your Supabase anon key');
  console.log('');
  console.log('   Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
  console.log('');
  console.log('   Example:');
  console.log('   export SUPABASE_URL="https://xxxxx.supabase.co"');
  console.log('   export SUPABASE_KEY="eyJhbG..."');
  console.log('');
  process.exit(1);
}

startSupabaseServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
