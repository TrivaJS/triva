# Error Tracking System

Triva includes a comprehensive error tracking system that automatically captures **ALL errors** from anywhere in your application for complete developer visibility.

## 🎯 What It Captures

The error tracker automatically logs:

1. ✅ **Route Handler Errors** - Errors in your `get()`, `post()`, etc. handlers
2. ✅ **Middleware Errors** - Errors in any middleware function
3. ✅ **Async Errors** - Errors in promises and async/await
4. ✅ **Uncaught Exceptions** - Global process-level uncaught exceptions
5. ✅ **Unhandled Rejections** - Unhandled promise rejections
6. ✅ **System Warnings** - Node.js process warnings
7. ✅ **User Code Errors** - ANY error from your application code
8. ✅ **Third-Party Errors** - Errors from npm packages you use

## 🚀 Zero Configuration Required

Error tracking is **automatically enabled** when you import Triva:

```javascript
import { build, get, listen } from 'triva';

build();

get('/test', (req, res) => {
  throw new Error('This error is automatically tracked!');
  // ✅ Captured with full context
  // ✅ Request details included
  // ✅ User agent parsed
  // ✅ Stack trace saved
  // ✅ Severity classified
});

listen(3000);
```

**That's it!** No setup needed. All errors are tracked automatically.

## 📊 Error Entry Structure

Every error is captured with comprehensive details:

```javascript
{
  id: "err_1234567890_abc123",
  timestamp: 1706400000000,
  datetime: "2024-01-27T12:00:00.000Z",
  
  error: {
    name: "TypeError",
    message: "Cannot read property 'x' of null",
    stack: "TypeError: Cannot read property...\n    at...",
    code: null,
    type: "type-error"
  },
  
  request: {
    method: "GET",
    url: "/api/users/123",
    pathname: "/api/users/123",
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    headers: { /* sanitized headers */ }
  },
  
  uaData: {
    browser: { name: "Chrome", version: "120.0.0.0" },
    os: { name: "Windows", version: "10.0" },
    device: { type: "desktop" },
    bot: { isBot: false }
  },
  
  context: {
    phase: "route",  // route, middleware, uncaught, etc.
    route: "/api/users/123",
    handler: "route_handler",
    custom: {}
  },
  
  system: {
    nodeVersion: "v20.0.0",
    platform: "linux",
    memory: { /* memory usage */ },
    uptime: 3600
  },
  
  severity: "high",  // critical, high, medium, low
  status: "unresolved",
  resolved: false,
  resolvedAt: null
}
```

## 🔧 Configuration (Optional)

You can customize error tracking behavior:

```javascript
import { errorTracker } from 'triva';

errorTracker.configure({
  enabled: true,           // Enable/disable tracking
  maxEntries: 10000,       // Maximum errors to store
  captureStackTrace: true, // Include stack traces
  captureContext: true,    // Include request context
  captureSystemInfo: true  // Include system info
});
```

## 📖 Accessing Error Data

### In Your Routes

```javascript
import { errorTracker } from 'triva';

get('/errors', async (req, res) => {
  // Get all errors
  const allErrors = await errorTracker.get('all');
  
  // Get recent errors
  const recent = await errorTracker.get({ limit: 20 });
  
  // Get unresolved errors
  const unresolved = await errorTracker.get({ resolved: false });
  
  // Get by severity
  const critical = await errorTracker.get({ severity: 'critical' });
  const high = await errorTracker.get({ severity: 'high' });
  
  // Get by type
  const typeErrors = await errorTracker.get({ type: 'type-error' });
  
  // Get by phase
  const routeErrors = await errorTracker.get({ phase: 'route' });
  const middlewareErrors = await errorTracker.get({ phase: 'middleware' });
  
  // Search errors
  const found = await errorTracker.get({ search: 'database' });
  
  // Time range
  const lastHour = await errorTracker.get({
    from: Date.now() - 3600000,
    limit: 100
  });
  
  res.json({ errors: recent });
});
```

### Get Specific Error

```javascript
get('/errors/:id', async (req, res) => {
  const error = await errorTracker.getById(req.params.id);
  res.json({ error });
});
```

### Get Statistics

```javascript
get('/errors/stats', async (req, res) => {
  const stats = await errorTracker.getStats();
  
  // Returns:
  // {
  //   total: 150,
  //   stored: 150,
  //   severity: { critical: 5, high: 20, medium: 100, low: 25 },
  //   types: { 'type-error': 30, 'reference-error': 10, ... },
  //   phases: { route: 80, middleware: 40, uncaught: 5 },
  //   resolved: 50,
  //   unresolved: 100,
  //   recent: { count: 1000, critical: 2, high: 10, ... }
  // }
  
  res.json(stats);
});
```

## 🎯 Error Severity Levels

Errors are automatically classified:

| Severity | Examples |
|----------|----------|
| **Critical** | Out of memory, fatal errors |
| **High** | TypeError, ReferenceError, uncaught exceptions |
| **Medium** | Route handler errors, middleware errors |
| **Low** | Validation errors, expected errors |

## 🔍 Error Types

Errors are categorized by type:

- `type-error` - TypeError
- `reference-error` - ReferenceError  
- `syntax-error` - SyntaxError
- `file-not-found` - ENOENT
- `connection-refused` - ECONNREFUSED
- `timeout` - ETIMEDOUT
- `json-parse-error` - JSON parsing failures
- `permission-error` - Permission denied
- `general` - Other errors

## 📍 Error Phases

Tracks where the error occurred:

- `route` - In a route handler
- `middleware` - In middleware
- `uncaught` - Uncaught exception
- `unhandled-rejection` - Unhandled promise rejection
- `warning` - System warning
- `request` - General request handling

## ✅ Managing Errors

### Mark as Resolved

```javascript
post('/errors/:id/resolve', async (req, res) => {
  const error = await errorTracker.resolve(req.params.id);
  res.json({ message: 'Resolved', error });
});
```

### Clear All Errors

```javascript
post('/errors/clear', async (req, res) => {
  const result = await errorTracker.clear();
  // Returns: { cleared: 150 }
  res.json(result);
});
```

## 🎨 Real-World Examples

### Error Dashboard Endpoint

```javascript
get('/admin/errors/dashboard', async (req, res) => {
  const stats = await errorTracker.getStats();
  const recent = await errorTracker.get({ limit: 10 });
  const unresolved = await errorTracker.get({ resolved: false, limit: 5 });
  const critical = await errorTracker.get({ severity: 'critical', limit: 5 });
  
  res.json({
    overview: stats,
    recentErrors: recent,
    unresolvedErrors: unresolved,
    criticalErrors: critical
  });
});
```

### Error Notification System

```javascript
import { errorTracker } from 'triva';

// Listen for critical errors and send alerts
setInterval(async () => {
  const critical = await errorTracker.get({ 
    severity: 'critical',
    resolved: false,
    from: Date.now() - 60000 // Last minute
  });
  
  if (critical.length > 0) {
    await sendSlackAlert(`🚨 ${critical.length} critical errors detected!`);
    await sendEmail('admin@example.com', 'Critical Errors', critical);
  }
}, 60000); // Check every minute
```

### Error Rate Limiting

```javascript
get('/risky-operation', async (req, res) => {
  const recentErrors = await errorTracker.get({
    phase: 'route',
    search: 'risky-operation',
    from: Date.now() - 300000 // Last 5 minutes
  });
  
  if (recentErrors.length > 10) {
    res.statusCode = 503;
    return res.json({ 
      error: 'Service temporarily unavailable',
      reason: 'Too many recent errors'
    });
  }
  
  // Proceed with operation
  performRiskyOperation();
  res.json({ success: true });
});
```

### Error Pattern Detection

```javascript
get('/admin/error-patterns', async (req, res) => {
  const errors = await errorTracker.get({ limit: 1000 });
  
  // Group by error message
  const patterns = {};
  errors.forEach(err => {
    const key = err.error.message;
    if (!patterns[key]) {
      patterns[key] = { count: 0, examples: [] };
    }
    patterns[key].count++;
    if (patterns[key].examples.length < 3) {
      patterns[key].examples.push(err.id);
    }
  });
  
  // Sort by frequency
  const sorted = Object.entries(patterns)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  
  res.json({ 
    message: 'Top 10 error patterns',
    patterns: sorted 
  });
});
```

## 🔒 Security Features

### Automatic Header Sanitization

Sensitive headers are automatically redacted:

```javascript
// These headers are sanitized:
- authorization: '[REDACTED]'
- cookie: '[REDACTED]'
- x-api-key: '[REDACTED]'
- x-auth-token: '[REDACTED]'
```

### Safe Error Messages

In production, error details can be hidden from users while still being logged:

```javascript
setErrorHandler((err, req, res) => {
  // Error is logged with full details
  // But user sees generic message
  
  res.statusCode = 500;
  res.json({
    error: 'Internal Server Error',
    // Don't expose details in production
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

## 📊 Filtering Options

```javascript
await errorTracker.get({
  severity: 'high',              // or ['high', 'critical']
  type: 'type-error',            // or ['type-error', 'reference-error']
  phase: 'route',                // route, middleware, uncaught, etc.
  resolved: false,               // true or false
  search: 'database',            // Search in message, name, url
  from: Date.now() - 3600000,    // Timestamp or Date
  to: Date.now(),                // Timestamp or Date
  limit: 50                      // Max results
});
```

## 🎓 Complete Example

```javascript
import { 
  build, 
  get, 
  post,
  middleware,
  listen,
  errorTracker,
  setErrorHandler
} from 'triva';

// Configure (optional)
errorTracker.configure({
  maxEntries: 5000,
  captureStackTrace: true
});

build();
middleware({
  throttle: { limit: 100, window_ms: 60000 }
});

// Routes (errors automatically tracked)
get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  // If getUser throws, it's automatically tracked!
  res.json({ user });
});

// View errors
get('/admin/errors', async (req, res) => {
  const errors = await errorTracker.get({ limit: 100 });
  res.json({ errors });
});

// Error stats
get('/admin/stats', async (req, res) => {
  const stats = await errorTracker.getStats();
  res.json(stats);
});

// Custom error handler
setErrorHandler((err, req, res) => {
  // Error already tracked before this runs
  
  if (!res.writableEnded) {
    res.statusCode = 500;
    res.json({ error: 'Something went wrong' });
  }
});

listen(3000);
```

## ⚡ Performance

- **Minimal overhead** - Async capture doesn't block requests
- **Automatic retention** - Old errors are automatically removed
- **Efficient storage** - In-memory with configurable limits
- **No external dependencies** - Pure JavaScript

## 🎯 Summary

**What you get automatically:**

✅ **Complete error visibility** - Every error captured  
✅ **Rich context** - Request, UA, system info  
✅ **Automatic categorization** - Severity and type  
✅ **Search & filter** - Find errors easily  
✅ **Statistics** - Error trends and patterns  
✅ **Security** - Sensitive data sanitized  
✅ **Zero configuration** - Works out of the box  

**No setup required - just import and use Triva!**

## 📝 Quick Reference

```javascript
import { errorTracker } from 'triva';

// Get errors
await errorTracker.get('all');
await errorTracker.get({ limit: 20 });
await errorTracker.get({ severity: 'critical' });
await errorTracker.get({ phase: 'route' });
await errorTracker.get({ search: 'database' });

// Get specific error
await errorTracker.getById('err_123_abc');

// Resolve error
await errorTracker.resolve('err_123_abc');

// Get stats
await errorTracker.getStats();

// Clear errors
await errorTracker.clear();

// Configure
errorTracker.configure({ maxEntries: 5000 });
```

Your application now has enterprise-grade error tracking! 🛡️
