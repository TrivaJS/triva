# Database Configuration Examples

Complete examples for configuring Triva with different databases.

## 📦 Supported Databases

- ✅ **Memory** (built-in, no package needed)
- ✅ **MongoDB** (requires: `npm install mongodb`)
- ✅ **Redis** (requires: `npm install redis`)
- ✅ **PostgreSQL** (requires: `npm install pg`)
- ✅ **MySQL** (requires: `npm install mysql2`)

## 🎯 Centralized Configuration

All configuration happens in `build()`:

```javascript
import { build, get, listen } from 'triva';

await build({
  env: 'development',
  
  cache: {
    type: 'mongodb',  // Choose your database
    retention: 600000,
    limit: 10000,
    database: {
      // Database-specific config here
    }
  },
  
  throttle: {
    limit: 100,
    window_ms: 60000
  },
  
  retention: {
    enabled: true,
    maxEntries: 10000
  }
});

// Routes...
listen(3000);
```

## 1️⃣ Memory (Built-in)

**No installation required!**

```javascript
await build({
  cache: {
    type: 'memory',  // or 'local'
    retention: 600000,  // 10 minutes
    limit: 10000
  }
});
```

## 2️⃣ MongoDB

### Install
```bash
npm install mongodb
```

### Configuration
```javascript
await build({
  cache: {
    type: 'mongodb',  // or 'mongo'
    retention: 600000,
    limit: 10000,
    
    database: {
      uri: 'mongodb://localhost:27017',
      database: 'triva',
      collection: 'cache',
      
      // Optional: MongoDB client options
      options: {
        maxPoolSize: 10,
        minPoolSize: 2
      }
    }
  }
});
```

### MongoDB Atlas (Cloud)
```javascript
await build({
  cache: {
    type: 'mongodb',
    database: {
      uri: 'mongodb+srv://username:password@cluster.mongodb.net/triva?retryWrites=true&w=majority',
      database: 'triva',
      collection: 'cache'
    }
  }
});
```

### What if MongoDB isn't installed?
```
❌ MongoDB package not found.

   Install it with: npm install mongodb

   Then restart your server.
```

## 3️⃣ Redis

### Install
```bash
npm install redis
```

### Configuration
```javascript
await build({
  cache: {
    type: 'redis',
    retention: 600000,
    
    database: {
      host: 'localhost',
      port: 6379,
      password: 'your-password',  // if needed
      database: 0
    }
  }
});
```

### Redis Cloud
```javascript
await build({
  cache: {
    type: 'redis',
    database: {
      url: 'redis://username:password@redis-cloud-host:port'
    }
  }
});
```

### What if Redis isn't installed?
```
❌ Redis package not found.

   Install it with: npm install redis

   Then restart your server.
```

## 4️⃣ PostgreSQL

### Install
```bash
npm install pg
```

### Configuration
```javascript
await build({
  cache: {
    type: 'postgresql',  // or 'postgres' or 'pg'
    retention: 600000,
    
    database: {
      host: 'localhost',
      port: 5432,
      database: 'triva',
      user: 'postgres',
      password: 'your-password',
      tableName: 'triva_cache',  // optional, default: 'triva_cache'
      
      // Optional: connection pool settings
      max: 20,
      min: 4,
      idleTimeoutMillis: 30000
    }
  }
});
```

### PostgreSQL Cloud (Heroku, AWS RDS, etc.)
```javascript
await build({
  cache: {
    type: 'postgresql',
    database: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  }
});
```

### What if PostgreSQL isn't installed?
```
❌ PostgreSQL package not found.

   Install it with: npm install pg

   Then restart your server.
```

## 5️⃣ MySQL

### Install
```bash
npm install mysql2
```

### Configuration
```javascript
await build({
  cache: {
    type: 'mysql',
    retention: 600000,
    
    database: {
      host: 'localhost',
      port: 3306,
      database: 'triva',
      user: 'root',
      password: 'your-password',
      tableName: 'triva_cache',  // optional, default: 'triva_cache'
      
      // Optional: connection pool settings
      connectionLimit: 10,
      queueLimit: 0
    }
  }
});
```

### MySQL Cloud
```javascript
await build({
  cache: {
    type: 'mysql',
    database: {
      host: 'mysql-cloud-host.com',
      port: 3306,
      database: 'triva',
      user: 'your-user',
      password: 'your-password',
      ssl: {
        ca: fs.readFileSync('/path/to/ca.pem')
      }
    }
  }
});
```

### What if MySQL isn't installed?
```
❌ MySQL package not found.

   Install it with: npm install mysql2

   Then restart your server.
```

## 🔄 Complete Examples

### Development (Memory)
```javascript
import { build, get, listen } from 'triva';

await build({
  env: 'development',
  
  cache: {
    type: 'memory',
    retention: 300000  // 5 minutes
  },
  
  throttle: {
    limit: 1000,  // More lenient for dev
    window_ms: 60000
  }
});

get('/', (req, res) => res.json({ status: 'ok' }));

listen(3000);
```

### Production (Redis)
```javascript
import { build, get, listen } from 'triva';

await build({
  env: 'production',
  
  cache: {
    type: 'redis',
    retention: 3600000,  // 1 hour
    database: {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD
    }
  },
  
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 10,
    ban_threshold: 3,
    ban_ms: 600000  // 10 min ban
  },
  
  retention: {
    enabled: true,
    maxEntries: 50000
  },
  
  errorTracking: {
    enabled: true,
    maxEntries: 10000
  }
});

get('/', (req, res) => res.json({ status: 'ok' }));

listen(process.env.PORT || 3000);
```

### Enterprise (PostgreSQL)
```javascript
import { build, get, listen } from 'triva';

await build({
  env: 'production',
  
  cache: {
    type: 'postgresql',
    retention: 7200000,  // 2 hours
    limit: 100000,
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: true,
      max: 20,  // Connection pool size
      min: 5
    }
  },
  
  throttle: {
    limit: 500,
    window_ms: 60000,
    burst_limit: 50,
    burst_window_ms: 1000,
    ban_threshold: 5,
    ban_ms: 3600000,  // 1 hour ban
    policies: ({ ip, ua, context }) => {
      // Custom throttling per route
      if (context.pathname?.startsWith('/api/admin')) {
        return { limit: 50, window_ms: 60000 };
      }
      return null;
    }
  },
  
  retention: {
    enabled: true,
    maxEntries: 100000
  },
  
  errorTracking: {
    enabled: true,
    maxEntries: 25000,
    captureStackTrace: true,
    captureContext: true,
    captureSystemInfo: true
  }
});

get('/', (req, res) => res.json({ status: 'ok' }));

listen(process.env.PORT || 3000);
```

## 🛠️ Testing Your Configuration

```javascript
import { build, get, listen, cache } from 'triva';

await build({
  cache: {
    type: 'mongodb',  // Your chosen database
    database: { /* config */ }
  }
});

get('/test-db', async (req, res) => {
  try {
    // Test write
    await cache.set('test-key', { data: 'test value' });
    
    // Test read
    const value = await cache.get('test-key');
    
    // Test stats
    const stats = await cache.stats();
    
    res.json({
      success: true,
      value,
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

listen(3000);
```

## ⚠️ Error Messages

### Missing Package
```
❌ MongoDB package not found.

   Install it with: npm install mongodb

   Then restart your server.
```

### Unknown Database Type
```
❌ Unknown database type: "mydb"

   Supported types:
   - memory/local (built-in, no package needed)
   - mongodb/mongo (requires: npm install mongodb)
   - redis (requires: npm install redis)
   - postgresql/postgres/pg (requires: npm install pg)
   - mysql (requires: npm install mysql2)
```

### Connection Failed
```
❌ MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
```

## 📊 Performance Comparison

| Database | Speed | Use Case |
|----------|-------|----------|
| Memory | ⚡⚡⚡ Fastest | Development, small apps |
| Redis | ⚡⚡⚡ Fastest | Production, distributed |
| MongoDB | ⚡⚡ Fast | Document storage needed |
| PostgreSQL | ⚡⚡ Fast | Enterprise, ACID required |
| MySQL | ⚡⚡ Fast | Traditional apps |

## 🎯 Recommendations

**Development:** Use Memory
- No setup required
- Fast
- Easy to debug

**Production (Small):** Use Redis
- Fastest external DB
- Simple setup
- Great for caching

**Production (Enterprise):** Use PostgreSQL or MongoDB
- Full-featured
- Reliable
- Scalable
- Good monitoring tools

---

**All databases work exactly the same way from your code!**

Just change the `type` and `database` config - everything else stays the same. 🚀
