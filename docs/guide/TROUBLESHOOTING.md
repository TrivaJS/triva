# Triva - Troubleshooting Guide

Common issues and solutions when using Triva.

## Installation Issues

### Error: "Cannot find module 'triva'"

**Cause:** Package not installed or linked incorrectly.

**Solutions:**
```bash
# If using npm link
npm link triva

# If installing normally
npm install triva

# Or from local path
npm install /path/to/triva

# Verify installation
npm ls triva
```

---

### Error: "SyntaxError: Cannot use import statement outside a module"

**Cause:** Missing `"type": "module"` in package.json.

**Solution:** Add to your project's `package.json`:
```json
{
  "type": "module"
}
```

---

### Error: "The requested module 'triva' does not provide an export named 'X'"

**Cause:** Trying to import something that isn't exported from the main file.

**Available exports from main `triva` module:**
```javascript
import { 
  build,           // Initialize server
  middleware,      // Add middleware
  get,             // GET route
  post,            // POST route
  put,             // PUT route
  delete,          // DELETE route (note: 'delete' not 'del')
  patch,           // PATCH route
  use,             // Add custom middleware
  listen,          // Start server
  setErrorHandler,
  setNotFoundHandler,
  TrivaServer,     // Server class
  log,             // Log instance
  cache,           // Cache instance
  configCache      // Cache configuration function
} from 'triva';
```

**Alternative imports (direct from submodules):**
```javascript
// Import cache directly
import { cache, configCache, CacheManager } from 'triva/cache';

// Import log directly
import { log, LogEntry } from 'triva/log';

// Import middleware directly
import { middleware } from 'triva/middleware';
```

---

## Runtime Issues

### Error: "Server not initialized. Call build() first."

**Cause:** Trying to use routing or middleware functions before calling `build()`.

**Solution:** Always call `build()` first:
```javascript
import { build, get, listen } from 'triva';

build({ env: 'development' }); // Call this first!

get('/test', handler); // Now this works
listen(3000);
```

---

### Error: "Port already in use" or "EADDRINUSE"

**Cause:** Another process is using the port.

**Solutions:**
```bash
# Find process using the port (example: port 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
listen(3001); // Instead of 3000
```

---

### Error: "Cannot read properties of undefined (reading 'throttle')"

**Cause:** Accessing `req.triva.throttle` when middleware isn't configured.

**Solution:** Either configure throttling or check existence:
```javascript
// Option 1: Configure throttling
middleware({
  throttle: {
    limit: 100,
    window_ms: 60000
  }
});

// Option 2: Check before accessing
if (req.triva?.throttle) {
  console.log(req.triva.throttle);
}
```

---

### Error: "Invalid JSON" when parsing body

**Cause:** Request body is not valid JSON.

**Solutions:**
```javascript
post('/api/data', async (req, res) => {
  try {
    const body = await req.json();
    res.json({ success: true, data: body });
  } catch (err) {
    res.status(400).json({ 
      error: 'Invalid JSON',
      message: err.message 
    });
  }
});
```

---

## Configuration Issues

### Throttling not working

**Check:**
1. Middleware is configured
2. Throttle options are set
3. Multiple requests are being made

**Debug:**
```javascript
middleware({
  throttle: {
    limit: 5,          // Low limit for testing
    window_ms: 60000,
    burst_limit: 3,
    burst_window_ms: 1000
  }
});

// Check throttle result in route
get('/test', (req, res) => {
  console.log('Throttle result:', req.triva.throttle);
  res.json({ throttle: req.triva.throttle });
});
```

---

### Cache not persisting data

**Common causes:**
1. Cache not enabled
2. TTL expired
3. Different cache type

**Solution:**
```javascript
import { configCache, cache } from 'triva';

// Enable and configure cache
configCache({
  cache_data: true,           // Must be true!
  cache_type: 'memory',       // or 'local'
  cache_retention: 3600000,   // 1 hour default TTL
  cache_limit: 100000
});

// Test cache
await cache.set('test', 'value', 10000); // 10 second TTL
const value = await cache.get('test');
console.log('Cached value:', value);
```

---

### Logs not being recorded

**Check:**
1. Retention is enabled
2. Middleware is configured

**Solution:**
```javascript
middleware({
  retention: {
    enabled: true,      // Must be true!
    maxEntries: 100000
  }
});

// Verify logs are being created
get('/check-logs', async (req, res) => {
  const logs = await log.get({ limit: 10 });
  res.json({ count: logs.length, logs });
});
```

---

## TypeScript Issues

### Type errors with imports

**Solution:** Make sure you have the type definitions:
```typescript
// Should work automatically if index.d.ts is in the package
import { build, get, listen } from 'triva';

// If not, you can reference them explicitly
/// <reference path="./node_modules/triva/index.d.ts" />
```

---

### Missing types for req/res

**Solution:** Use the provided types:
```typescript
import type { RequestContext, ResponseHelpers } from 'triva';

get('/test', (req: RequestContext, res: ResponseHelpers) => {
  res.json({ test: 'typed!' });
});
```

---

## Performance Issues

### Server is slow or unresponsive

**Possible causes:**
1. Too many log entries
2. Large cache
3. Heavy middleware

**Solutions:**
```javascript
// Limit log retention
middleware({
  retention: {
    enabled: true,
    maxEntries: 10000  // Lower number
  }
});

// Limit cache size
configCache({
  cache_type: 'memory',  // Use LRU eviction
  cache_limit: 10000     // Lower limit
});

// Regular cleanup
setInterval(async () => {
  await cache.cleanup();
  console.log('Cache cleaned');
}, 5 * 60 * 1000); // Every 5 minutes
```

---

### Memory usage growing

**Cause:** Logs/cache growing unbounded.

**Solution:** Use memory cache with limits:
```javascript
configCache({
  cache_type: 'memory',  // Enforces limits with LRU
  cache_limit: 50000
});

middleware({
  retention: {
    enabled: true,
    maxEntries: 50000  // Hard limit
  }
});
```

---

## Development Issues

### Changes not reflected after editing

**If using npm link:**
```bash
# No need to reinstall, just restart your server
# Ctrl+C and run again
node index.js
```

**If using npm pack:**
```bash
# Must recreate and reinstall
cd /path/to/triva
npm pack
cd /path/to/test-project
npm install /path/to/triva/triva-1.0.0.tgz
```

---

### Tests failing

**Common causes:**
1. Port conflicts
2. Async timing issues
3. Cached data from previous tests

**Solutions:**
```javascript
// Clean up before tests
import { test } from 'node:test';
import { cache, log } from 'triva';

test('my test', async (t) => {
  // Clear state before test
  await cache.clear();
  await log.clear();
  
  // Run test
  // ...
});
```

---

## Getting Help

If you're still having issues:

1. **Check the documentation:**
   - README.md
   - QUICKSTART.md
   - Example files

2. **Enable debug mode:**
   ```javascript
   build({ env: 'development' });
   // More verbose error messages in dev mode
   ```

3. **Minimal reproduction:**
   Create the simplest possible example that shows the issue:
   ```javascript
   import { build, get, listen } from 'triva';
   
   build();
   get('/', (req, res) => res.send('test'));
   listen(3000);
   ```

4. **Check versions:**
   ```bash
   node --version  # Should be >= 18.0.0
   npm --version
   npm ls triva
   ```

5. **Report issues:**
   - Include Node.js version
   - Include error message
   - Include minimal code to reproduce
   - Include what you expected vs what happened
