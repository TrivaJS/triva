# Supabase Database Integration

Triva supports Supabase as a database adapter for caching, providing a managed PostgreSQL database with real-time capabilities.

## Installation

```bash
npm install @supabase/supabase-js
```

## Quick Start

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to provision (~2 minutes)

### 2. Create Cache Table

Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS triva_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_triva_cache_expires_at 
ON triva_cache (expires_at);
```

### 3. Get API Credentials

From Project Settings > API:
- **URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Configure Triva

```javascript
import { build, get, listen } from 'triva';

await build({
  cache: {
    type: 'supabase',
    retention: 3600000, // 1 hour
    
    database: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    }
  }
});

get('/api/data', (req, res) => {
  res.json({ message: 'Cached in Supabase!' });
});

listen(3000);
```

## Configuration Options

### Basic Configuration

```javascript
cache: {
  type: 'supabase',
  retention: 3600000,  // Default TTL in milliseconds
  
  database: {
    url: 'https://xxxxx.supabase.co',      // Required
    key: 'your-anon-key',                   // Required
    tableName: 'triva_cache',               // Optional (default: 'triva_cache')
    options: {                               // Optional Supabase client options
      auth: {
        persistSession: false
      }
    }
  }
}
```

### Environment Variables (Recommended)

```javascript
cache: {
  type: 'supabase',
  database: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  }
}
```

**.env file:**
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Custom Table Name

```javascript
cache: {
  type: 'supabase',
  database: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    tableName: 'my_custom_cache'  // Custom table name
  }
}
```

**SQL for custom table:**
```sql
CREATE TABLE my_custom_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_my_custom_cache_expires_at 
ON my_custom_cache (expires_at);
```

## Row Level Security (RLS)

For production, enable Row Level Security:

```sql
-- Enable RLS
ALTER TABLE triva_cache ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust based on your needs)
CREATE POLICY "Allow all operations" ON triva_cache
FOR ALL USING (true);

-- Or more restrictive: Allow only service role
CREATE POLICY "Service role only" ON triva_cache
FOR ALL USING (auth.role() = 'service_role');
```

If using service role key (not recommended for client):

```javascript
database: {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY  // Service role key
}
```

## Complete Example

```javascript
import { build, get, post, delete as del, listen } from 'triva';

await build({
  env: 'production',
  
  cache: {
    type: 'supabase',
    retention: 3600000,
    
    database: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
      tableName: 'triva_cache',
      
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
  
  throttle: {
    limit: 100,
    window_ms: 60000
  }
});

// Cached endpoint (GET requests are cached)
get('/api/products', async (req, res) => {
  const products = await fetchProductsFromDB();
  res.json({ products });
});

// Not cached (POST/PUT/DELETE bypass cache)
post('/api/products', async (req, res) => {
  const product = await req.json();
  await saveProduct(product);
  res.status(201).json({ created: product });
});

// Cache management
del('/api/cache/:key', async (req, res) => {
  // Manual cache invalidation
  await cache.delete(req.params.key);
  res.json({ deleted: true });
});

listen(3000);
```

## Features

### Automatic Expiration

Supabase adapter handles TTL automatically:

```javascript
// Set with custom TTL (5 minutes)
await cache.set('user:123', userData, 300000);

// Auto-expires after 5 minutes
```

Expired entries are:
- Ignored by `get()` operations
- Can be cleaned up with periodic jobs

### Pattern Matching

```javascript
// Delete all user cache entries
await cache.delete('user:*');

// Get all session keys
const sessionKeys = await cache.keys('session:*');
```

### JSONB Storage

Values are stored as JSONB, enabling:
- Efficient storage
- Native JSON queries
- PostgreSQL JSON operators

## Performance

### Benchmarks

On Supabase Free Tier:
- **Set**: ~50-100ms (includes network)
- **Get**: ~30-80ms (includes network)
- **Delete**: ~40-90ms (includes network)

On Supabase Pro (Dedicated):
- **Set**: ~20-50ms
- **Get**: ~10-30ms
- **Delete**: ~15-40ms

### Optimization Tips

1. **Connection Pooling**: Supabase client handles this automatically

2. **Batch Operations**: For bulk cache operations
   ```javascript
   // Instead of multiple sets
   await Promise.all(items.map(item => 
     cache.set(`item:${item.id}`, item)
   ));
   ```

3. **Regional Deployment**: Deploy your app in same region as Supabase

4. **Indexes**: The expires_at index is crucial for performance

## Supabase Tiers

| Tier | Price | Database Size | Bandwidth | Best For |
|------|-------|--------------|-----------|----------|
| Free | $0/mo | 500 MB | Unlimited | Development |
| Pro | $25/mo | 8 GB | Unlimited | Production |
| Team | $599/mo | 100 GB | Unlimited | Scale |

[Pricing Details](https://supabase.com/pricing)

## Comparison with Other Adapters

| Feature | Supabase | PostgreSQL | Redis | MongoDB |
|---------|----------|------------|-------|---------|
| Setup | Easy | Medium | Medium | Medium |
| Managed | ✅ | ❌ | ❌ | ✅ Atlas |
| Free Tier | ✅ 500MB | ❌ | ❌ | ✅ 512MB |
| Dashboard | ✅ | ❌ | ❌ | ✅ |
| Real-time | ✅ | ❌ | ✅ | ✅ |
| JSONB | ✅ | ✅ | ❌ | ✅ |
| Speed | Fast | Fast | Fastest | Fast |

## Migration

### From PostgreSQL

Already using PostgreSQL? Switch to Supabase:

**Before:**
```javascript
cache: {
  type: 'postgresql',
  database: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'user',
    password: 'pass'
  }
}
```

**After:**
```javascript
cache: {
  type: 'supabase',
  database: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  }
}
```

### Data Migration

Export from PostgreSQL:
```bash
pg_dump -h localhost -U user -t triva_cache mydb > cache_backup.sql
```

Import to Supabase (via SQL Editor):
```sql
-- Run the exported SQL in Supabase SQL Editor
```

## Troubleshooting

### "Package not found"

**Error:**
```
❌ Supabase package not found
   Install with: npm install @supabase/supabase-js
```

**Fix:**
```bash
npm install @supabase/supabase-js
```

### "Supabase requires url and key"

**Error:**
```
❌ Supabase requires url and key
```

**Fix:**
- Add `url` and `key` to database config
- Get from: Dashboard > Settings > API

### "relation triva_cache does not exist"

**Error:**
```
relation "triva_cache" does not exist
```

**Fix:**
Run table creation SQL in Supabase SQL Editor:
```sql
CREATE TABLE triva_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ
);
```

### "new row violates row-level security policy"

**Error:**
```
new row violates row-level security policy
```

**Fix:**
Either:
1. Disable RLS (development only):
   ```sql
   ALTER TABLE triva_cache DISABLE ROW LEVEL SECURITY;
   ```

2. Create permissive policy:
   ```sql
   CREATE POLICY "Allow all" ON triva_cache FOR ALL USING (true);
   ```

3. Use service role key instead of anon key

### Slow Performance

**Issue:** Operations taking >200ms

**Fixes:**
1. Check Supabase region vs your app region
2. Upgrade from Free to Pro tier
3. Add database indexes (already included)
4. Use connection pooling (automatic)

### Connection Issues

**Issue:** Intermittent connection failures

**Fix:**
Add retry logic:
```javascript
database: {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
  options: {
    global: {
      headers: {
        'x-retry-after': '1000'
      }
    }
  }
}
```

## Best Practices

### 1. Use Environment Variables

```javascript
// ✅ Good
database: {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY
}

// ❌ Bad
database: {
  url: 'https://xxxxx.supabase.co',  // Hardcoded
  key: 'eyJhbG...'                    // Exposed
}
```

### 2. Enable RLS in Production

```sql
ALTER TABLE triva_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON triva_cache
FOR ALL USING (auth.role() = 'service_role');
```

### 3. Set Appropriate TTLs

```javascript
// Short-lived data
cache.set('session:abc', data, 900000);  // 15 minutes

// Long-lived data
cache.set('config', data, 86400000);  // 24 hours
```

### 4. Clean Up Expired Entries

Supabase doesn't auto-delete expired rows. Run periodic cleanup:

```sql
-- Create function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM triva_cache 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
SELECT cron.schedule(
  'clean-cache',
  '0 * * * *',  -- Every hour
  'SELECT clean_expired_cache()'
);
```

### 5. Monitor Usage

Check cache statistics:
```sql
-- Total cache entries
SELECT COUNT(*) FROM triva_cache;

-- Expired entries
SELECT COUNT(*) FROM triva_cache 
WHERE expires_at < NOW();

-- Cache size
SELECT pg_size_pretty(pg_total_relation_size('triva_cache'));
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For Supabase-specific issues:
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

For Triva integration issues:
- Open issue on Triva GitHub
