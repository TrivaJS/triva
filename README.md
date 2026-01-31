# Triva

<p align="center">

  <h1 align="center">Triva</h1>

  <p align="center">
    A Node.js HTTP Server Framework built for enterprises
  </p>

  <p align="center">
    Triva is an enterprise-grade Node.js HTTP framework with centralized configuration, database adapters, advanced middleware, and complete developer visibility.
  </p>

</p>

> [!IMPORTANT]
> **v0.3.0 - Pre Release**
>
> This release is intended solely for the **continued development & testing of Triva & its capabilities.** Expect **rapid updates containing bug fixes, feature reworks, & framekwork optimization** going forward, until the official release of v1.0.0 and onward.
>
> During the **Pre-release** phase, a wide range of efforts to build a **user-friendly documentation interface** will also be in the works. Until the release of that interface, it's recommended that developers testing Triva refer to the docs found below.
>
>**If you're looking to contribute in any capacity, please feel free to submit a pull request or issue ticket for review.**
>
>

## ✨ Features

- 🎯 **Centralized Configuration** - Everything configured in `build()`
- 🗄️ **Multiple Databases** - Memory, MongoDB, Redis, PostgreSQL, MySQL
- 📦 **Auto-Detection** - Helpful errors if database packages aren't installed
- 🚀 **Zero Dependencies** (core) - Optional database drivers as needed
- 🛡️ **Advanced Throttling** - Sliding window, burst protection, auto-ban
- 📊 **Comprehensive Logging** - Request logs with cookies, UA data
- ⚡ **Built-in Caching** - Works with any supported database
- 🔍 **Error Tracking** - Automatic error capture with full context
- 🍪 **Cookie Parser** - Parse and set cookies easily
- 📥 **File Operations** - Download and send files
- 🌐 **JSONP Support** - Cross-domain API calls
- ⚙️ **Custom Middleware** - Full Express-style middleware support

## 📦 Installation

```bash
npm install triva

# Optional: Install database driver if needed
npm install mongodb  # For MongoDB
npm install redis    # For Redis
npm install pg       # For PostgreSQL
npm install mysql2   # For MySQL
```

## 🚀 Quick Start

```javascript
import { build, get, listen } from 'triva';

// All configuration in one place!
await build({
  env: 'development',

  cache: {
    type: 'memory',
    retention: 600000
  },

  throttle: {
    limit: 100,
    window_ms: 60000
  }
});

get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

listen(3000);
```

## 🎯 Centralized Configuration

Everything is configured in `build()`:

```javascript
await build({
  env: 'development',

  // Cache Configuration
  cache: {
    type: 'mongodb',        // memory, mongodb, redis, postgresql, mysql
    retention: 600000,       // 10 minutes
    limit: 10000,

    database: {
      uri: 'mongodb://localhost:27017',
      database: 'triva',
      collection: 'cache'
    }
  },

  // Throttle Configuration
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 20,
    burst_window_ms: 1000,
    ban_threshold: 5,
    ban_ms: 300000
  },

  // Log Retention
  retention: {
    enabled: true,
    maxEntries: 10000
  },

  // Error Tracking
  errorTracking: {
    enabled: true,
    maxEntries: 5000
  }
});
```

## 🗄️ Database Support

### Memory (Built-in)
```javascript
await build({
  cache: { type: 'memory' }
});
```

### MongoDB
```bash
npm install mongodb
```

```javascript
await build({
  cache: {
    type: 'mongodb',
    database: {
      uri: 'mongodb://localhost:27017',
      database: 'triva'
    }
  }
});
```

### Redis
```bash
npm install redis
```

```javascript
await build({
  cache: {
    type: 'redis',
    database: {
      host: 'localhost',
      port: 6379
    }
  }
});
```

### PostgreSQL
```bash
npm install pg
```

```javascript
await build({
  cache: {
    type: 'postgresql',
    database: {
      host: 'localhost',
      port: 5432,
      database: 'triva',
      user: 'postgres',
      password: 'password'
    }
  }
});
```

### MySQL
```bash
npm install mysql2
```

```javascript
await build({
  cache: {
    type: 'mysql',
    database: {
      host: 'localhost',
      port: 3306,
      database: 'triva',
      user: 'root',
      password: 'password'
    }
  }
});
```

**Helpful Errors:**
```
❌ MongoDB package not found.

   Install it with: npm install mongodb

   Then restart your server.
```

## 📖 Core Features

### Routing

```javascript
import { get, post, put, delete as del } from 'triva';

get('/users', (req, res) => {
  res.json({ users: [] });
});

get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ userId: id });
});

post('/users', async (req, res) => {
  const data = await req.json();
  res.json({ created: true });
});
```

### Cookies

```javascript
import { use, cookieParser } from 'triva';

use(cookieParser());

get('/login', (req, res) => {
  res.cookie('sessionId', 'abc123', {
    httpOnly: true,
    maxAge: 3600000
  });
  res.json({ success: true });
});

get('/profile', (req, res) => {
  const sessionId = req.cookies.sessionId;
  res.json({ sessionId });
});
```

### File Operations

```javascript
// Download file
get('/download', (req, res) => {
  res.download('/path/to/file.pdf', 'report.pdf');
});

// Send file
get('/view', (req, res) => {
  res.sendFile('/path/to/document.pdf');
});
```

### JSONP

```javascript
get('/api/data', (req, res) => {
  res.jsonp({ users: ['Alice', 'Bob'] });
});
```

### Custom Middleware

```javascript
use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### Logging

```javascript
import { log } from 'triva';

// Get logs
const logs = await log.get({ limit: 100 });

// Export logs
await log.export('all', 'my-logs.json');

// Get stats
const stats = await log.getStats();
```

### Error Tracking

```javascript
import { errorTracker } from 'triva';

// Get errors
const errors = await errorTracker.get({ severity: 'critical' });

// Get stats
const stats = await errorTracker.getStats();
```

## 📊 Complete Example

```javascript
import {
  build,
  use,
  get,
  post,
  listen,
  cookieParser,
  log
} from 'triva';

// Centralized configuration
await build({
  env: 'production',

  cache: {
    type: 'redis',
    database: {
      host: process.env.REDIS_HOST,
      port: 6379
    }
  },

  throttle: {
    limit: 100,
    window_ms: 60000
  },

  retention: {
    enabled: true,
    maxEntries: 50000
  }
});

// Middleware
use(cookieParser());

// Routes
get('/', (req, res) => {
  res.json({ status: 'ok', cookies: req.cookies });
});

get('/api/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

post('/api/users', async (req, res) => {
  const data = await req.json();
  res.status(201).json({ created: true, data });
});

get('/download/report', (req, res) => {
  res.download('./reports/annual-report.pdf');
});

get('/admin/logs/export', async (req, res) => {
  const result = await log.export({ limit: 1000 });
  res.json({ exported: result.count });
});

// Start server
listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
```

## 🔧 Response Methods

```javascript
res.json(data)                    // Send JSON
res.send(data)                    // Auto-detect (HTML/JSON/text)
res.html(html)                    // Send HTML
res.status(code)                  // Set status code
res.header(name, value)           // Set header
res.redirect(url, code)           // Redirect
res.jsonp(data)                   // Send JSONP
res.download(path, filename)      // Download file
res.sendFile(path, options)       // Send file
res.cookie(name, value, options)  // Set cookie
res.clearCookie(name)             // Clear cookie
```

## ⚡ Performance

- **Memory**: Fastest (built-in)
- **Redis**: Fastest (external DB)
- **MongoDB**: Fast (document store)
- **PostgreSQL**: Fast (ACID compliance)
- **MySQL**: Fast (traditional)

## 📄 License

MIT
