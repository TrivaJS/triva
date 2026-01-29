# Triva

Enterprise-grade Node.js HTTP framework with advanced middleware, throttling, logging, caching, error tracking, and cookie support.

## ✨ Features

- 🚀 **Zero Dependencies** - Pure Node.js, no external packages
- 🛡️ **Advanced Throttling** - Sliding window, burst protection, auto-ban, UA rotation detection
- 📊 **Comprehensive Logging** - Request logs with cookies, UA data, and analytics
- ⚡ **Built-in Caching** - LRU eviction, TTL, pattern matching
- 🔍 **Error Tracking** - Automatic error capture with full context
- 🍪 **Cookie Parser** - Parse and set cookies with ease
- 📥 **File Operations** - Download and send files
- 🌐 **JSONP Support** - Cross-domain API calls
- ⚙️ **Custom Middleware** - Full Express-style middleware support
- 📝 **TypeScript Support** - Complete type definitions included

## 📦 Installation

```bash
npm install triva
```

## 🚀 Quick Start

```javascript
import { build, get, listen } from 'triva';

build();

get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## 📖 Core Concepts

### Server Setup

```javascript
import { build, middleware, listen } from 'triva';

build({ env: 'development' });

middleware({
  retention: {
    enabled: true,
    maxEntries: 10000
  },
  throttle: {
    limit: 100,
    window_ms: 60000
  }
});

listen(3000);
```

### Routing

```javascript
import { get, post, put, delete as del, patch } from 'triva';

get('/users', (req, res) => {
  res.json({ users: [] });
});

post('/users', async (req, res) => {
  const data = await req.json();
  res.json({ created: true });
});

put('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ updated: id });
});

del('/users/:id', (req, res) => {
  res.json({ deleted: req.params.id });
});
```

### Route Parameters

```javascript
get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});
```

### Query Parameters

```javascript
get('/search', (req, res) => {
  const { q, page, limit } = req.query;
  res.json({ query: q, page, limit });
});
```

## 🍪 Cookies

```javascript
import { use, cookieParser } from 'triva';

// Add cookie parser middleware
use(cookieParser());

get('/login', (req, res) => {
  // Set cookie
  res.cookie('sessionId', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 3600000 // 1 hour
  });
  
  res.json({ success: true });
});

get('/profile', (req, res) => {
  // Read cookies
  const sessionId = req.cookies.sessionId;
  res.json({ sessionId });
});

get('/logout', (req, res) => {
  // Clear cookie
  res.clearCookie('sessionId');
  res.json({ loggedOut: true });
});
```

## 📥 File Operations

### Download Files

```javascript
get('/download/report', (req, res) => {
  res.download('/path/to/report.pdf', 'Annual-Report.pdf');
});
```

### Send Files

```javascript
get('/view/document', (req, res) => {
  res.sendFile('/path/to/document.pdf', {
    contentType: 'application/pdf'
  });
});
```

## 🌐 JSONP

```javascript
get('/api/data', (req, res) => {
  res.jsonp({ users: ['Alice', 'Bob'] });
});

// Client: /api/data?callback=myFunction
```

## 📊 Response Methods

```javascript
// JSON
res.json({ data: 'value' });

// HTML (auto-detected)
res.send('<h1>Hello</h1>');

// HTML (explicit)
res.html('<h1>Hello</h1>');

// Plain text
res.send('Hello');

// Status code
res.status(404).json({ error: 'Not found' });

// Headers
res.header('X-Custom', 'value').json({ data: 'value' });

// Redirect
res.redirect('/new-url', 301);
```

## ⚙️ Custom Middleware

```javascript
import { use } from 'triva';

// Request logger
use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Authentication
use((req, res, next) => {
  const token = req.headers.authorization;
  req.user = token ? verifyToken(token) : null;
  next();
});

// Error handling
use((req, res, next) => {
  try {
    // Your logic
    next();
  } catch (error) {
    next(error);
  }
});
```

## 📝 Logging

```javascript
import { log } from 'triva';

// Get logs
const logs = await log.get({ limit: 100 });

// Get stats
const stats = await log.getStats();

// Search logs
const results = await log.search('error');

// Export logs to file
await log.export('all', 'my-logs.json');
await log.export({ limit: 100 }, 'recent-logs.json');

// Clear logs
await log.clear();
```

## 🛡️ Error Tracking

```javascript
import { errorTracker } from 'triva';

// Get errors
const errors = await errorTracker.get({ severity: 'critical' });

// Get error by ID
const error = await errorTracker.getById('err_123_abc');

// Mark as resolved
await errorTracker.resolve('err_123_abc');

// Get stats
const stats = await errorTracker.getStats();

// Clear errors
await errorTracker.clear();
```

## ⚡ Caching

```javascript
import { cache, configCache } from 'triva';

// Configure cache
configCache({
  cache_type: 'memory',
  cache_limit: 10000,
  cache_retention: 600000 // 10 minutes
});

// Set cache
await cache.set('user:123', userData, 3600000); // 1 hour TTL

// Get cache
const user = await cache.get('user:123');

// Delete cache
await cache.delete('user:123');

// Clear all
await cache.clear();

// Get stats
const stats = await cache.stats();
```

## 🔧 Error Handlers

```javascript
import { setErrorHandler, setNotFoundHandler } from 'triva';

// Custom error handler
setErrorHandler((err, req, res) => {
  console.error(err);
  if (!res.writableEnded) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

// Custom 404 handler
setNotFoundHandler((req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
});
```

## 📊 Complete Example

```javascript
import { 
  build,
  middleware,
  use,
  get,
  post,
  listen,
  cookieParser,
  log,
  errorTracker
} from 'triva';

// Initialize
build({ env: 'development' });

// Middleware
use(cookieParser());

use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

middleware({
  retention: { enabled: true, maxEntries: 10000 },
  throttle: { limit: 100, window_ms: 60000 }
});

// Routes
get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    cookies: req.cookies
  });
});

get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

post('/users', async (req, res) => {
  const data = await req.json();
  res.status(201).json({ created: true, data });
});

get('/download', (req, res) => {
  res.download('/path/to/file.pdf');
});

// Admin routes
get('/admin/logs', async (req, res) => {
  const logs = await log.get({ limit: 100 });
  res.json({ logs });
});

get('/admin/errors', async (req, res) => {
  const errors = await errorTracker.get({ limit: 50 });
  res.json({ errors });
});

// Start server
listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## 📄 License

MIT

## 👨‍💻 Author

Kris Powers

---

Built with ❤️ using pure Node.js
