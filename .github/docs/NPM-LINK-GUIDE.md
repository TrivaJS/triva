# NPM Link Testing - Step by Step Guide

This is the **recommended** way to test Triva locally as if it were installed from npm.

## What is `npm link`?

`npm link` creates a symbolic link from your global node_modules to your local package, allowing you to:
- Test your package as if it were published
- See changes immediately without reinstalling
- Test in multiple projects simultaneously

## Step-by-Step Instructions

### 1. Prepare Your Triva Package

```bash
# Navigate to your triva directory
cd /path/to/triva

# Make sure package.json is correct
cat package.json

# Create the global link
npm link
```

You should see:
```
added 1 package, and audited 1 package in Xs
```

This creates a symlink in your global node_modules pointing to your local triva directory.

### 2. Create a Test Project

```bash
# Create a new directory for testing
mkdir ~/triva-test
cd ~/triva-test

# Initialize npm project
npm init -y

# IMPORTANT: Add ES module support
# Edit package.json and add "type": "module"
```

Your `package.json` should look like:
```json
{
  "name": "triva-test",
  "version": "1.0.0",
  "type": "module",
  "description": "Testing Triva locally",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
```

### 3. Link Triva to Your Test Project

```bash
# In your test project directory
npm link triva
```

You should see:
```
added 1 package, and audited 1 package in Xs
```

### 4. Create a Test File

Create `index.js`:

```javascript
import { build, middleware, get, listen, log, cache, configCache } from 'triva';

console.log('✅ Triva loaded successfully!\n');

// Initialize
build({ env: 'development' });

// Configure cache
configCache({
  cache_data: true,
  cache_type: 'memory',
  cache_limit: 10000
});

// Add middleware
middleware({
  retention: { enabled: true, maxEntries: 10000 },
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 20,
    burst_window_ms: 1000
  }
});

// Routes
get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Triva Test!',
    timestamp: Date.now()
  });
});

get('/test', (req, res) => {
  res.json({ 
    test: 'success',
    query: req.query
  });
});

get('/users/:id', (req, res) => {
  res.json({ 
    userId: req.params.id,
    name: `User ${req.params.id}`
  });
});

get('/cache-demo', async (req, res) => {
  // Set a value
  await cache.set('demo', { time: Date.now() }, 30000);
  
  // Get it back
  const value = await cache.get('demo');
  
  res.json({ cached: value });
});

get('/logs', async (req, res) => {
  const logs = await log.get({ limit: 10 });
  res.json({ 
    count: logs.length,
    logs 
  });
});

get('/stats', async (req, res) => {
  const [logStats, cacheStats] = await Promise.all([
    log.getStats(),
    cache.stats()
  ]);
  
  res.json({
    logs: logStats,
    cache: cacheStats
  });
});

// Start server
listen(3000, () => {
  console.log('🚀 Triva test server running!');
  console.log('📍 http://localhost:3000\n');
  console.log('Try:');
  console.log('  curl http://localhost:3000/');
  console.log('  curl http://localhost:3000/test?foo=bar');
  console.log('  curl http://localhost:3000/users/123');
  console.log('  curl http://localhost:3000/cache-demo');
  console.log('  curl http://localhost:3000/logs');
  console.log('  curl http://localhost:3000/stats');
  console.log('\nPress Ctrl+C to stop\n');
});
```

### 5. Run Your Test

```bash
node index.js
```

Or with npm:
```bash
npm start
```

### 6. Test the Endpoints

In another terminal:

```bash
# Basic test
curl http://localhost:3000/

# With query params
curl "http://localhost:3000/test?foo=bar&baz=qux"

# With route params
curl http://localhost:3000/users/123

# Test cache
curl http://localhost:3000/cache-demo

# View logs
curl http://localhost:3000/logs

# View stats
curl http://localhost:3000/stats
```

## Making Changes

The beauty of `npm link` is that changes are reflected immediately:

1. **Edit your Triva source code**
   ```bash
   cd /path/to/triva
   # Edit triva.js, cache.js, etc.
   ```

2. **Restart your test server**
   ```bash
   # Ctrl+C to stop, then:
   node index.js
   ```

3. **Test again**
   - No need to reinstall or re-link!

## Testing Multiple Projects

You can test the same Triva package in multiple projects:

```bash
# Project 1
cd ~/project1
npm link triva

# Project 2
cd ~/project2
npm link triva

# Both will use the same source
```

## Cleanup

When you're done testing:

### 1. Unlink from test project
```bash
cd ~/triva-test
npm unlink triva
```

### 2. Remove global link
```bash
cd /path/to/triva
npm unlink
```

Or globally:
```bash
npm unlink -g triva
```

## Troubleshooting

### Problem: "Cannot find module 'triva'"

**Solution:**
```bash
# Check if link exists
ls -la $(npm root -g)/triva

# Re-create the link
cd /path/to/triva
npm unlink
npm link

# Re-link in test project
cd ~/triva-test
npm link triva
```

### Problem: "SyntaxError: Cannot use import statement"

**Solution:** Make sure `package.json` has `"type": "module"`

### Problem: Changes not showing up

**Solution:**
- Make sure you saved the file
- Restart the test server
- Check you're editing the right file:
  ```bash
  # Show where the link points
  ls -la node_modules/triva
  ```

### Problem: Port already in use

**Solution:**
```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

## Advanced: Testing with Different Node Versions

```bash
# Using nvm
nvm use 18
npm link

nvm use 20
cd ~/triva-test
npm link triva
node index.js
```

## Verifying the Link

```bash
# In your test project
npm ls triva

# Should show:
# triva-test@1.0.0 /path/to/triva-test
# └── triva@1.0.0 -> ./../../../path/to/triva
```

## Tips

1. **Use nodemon for auto-restart:**
   ```bash
   npm install -g nodemon
   nodemon index.js
   ```

2. **Check what's linked:**
   ```bash
   npm ls -g --depth=0 --link=true
   ```

3. **Link status:**
   ```bash
   # In test project
   ls -la node_modules/ | grep triva
   ```

## Complete Testing Workflow

```bash
# 1. Initial setup (do once)
cd /path/to/triva
npm link

# 2. Create test project (do once)
mkdir ~/triva-test
cd ~/triva-test
npm init -y
# Add "type": "module" to package.json
npm link triva

# 3. Create test file (do once)
# Create index.js with your test code

# 4. Development loop (repeat)
# Edit triva source → Save → Restart test server → Test

# 5. Cleanup (when done)
cd ~/triva-test
npm unlink triva
cd /path/to/triva
npm unlink
```

This workflow gives you the fastest development experience while testing your package exactly as users will use it!
