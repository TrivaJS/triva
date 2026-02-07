# Testing Triva Locally Before Publishing

There are several ways to test your NPM package locally before publishing. Here are the best methods:

## Method 1: Using `npm link` (Recommended)

This creates a symlink to your package, allowing you to use it as if it were installed from npm.

### Step 1: Link the package
```bash
# In your triva package directory
cd /path/to/triva
npm link
```

### Step 2: Create a test project and link to it
```bash
# Create a new test project
mkdir triva-test-project
cd triva-test-project
npm init -y

# Link to your local triva package
npm link triva
```

### Step 3: Create a test file
```bash
# Create test.js in your test project
cat > test.js << 'EOF'
import { build, middleware, get, listen, configCache } from 'triva';

build({ env: 'development' });

configCache({
  cache_data: true,
  cache_type: 'memory',
  cache_limit: 100000
});

middleware({
  retention: { enabled: true, maxEntries: 100000 },
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 20,
    burst_window_ms: 1000
  }
});

get('/test', (req, res) => {
  res.json({ message: 'It works!' });
});

listen(3000, () => {
  console.log('Test server running on http://localhost:3000');
});
EOF
```

### Step 4: Update package.json for ES modules
```bash
# Add "type": "module" to package.json
cat > package.json << 'EOF'
{
  "name": "triva-test-project",
  "version": "1.0.0",
  "type": "module",
  "description": "Test project for Triva",
  "main": "test.js",
  "scripts": {
    "start": "node test.js"
  }
}
EOF
```

### Step 5: Run your test
```bash
npm start
# or
node test.js
```

### Step 6: Test the endpoints
```bash
# In another terminal
curl http://localhost:3000/test
```

### Cleanup when done
```bash
# In your test project
npm unlink triva

# In your triva package directory
npm unlink
```

---

## Method 2: Using `npm pack` and Local Install

This creates an actual tarball and installs it, exactly like npm would.

### Step 1: Create the tarball
```bash
# In your triva directory
cd /path/to/triva
npm pack
# This creates: triva-1.0.0.tgz
```

### Step 2: Install in test project
```bash
# Create test project
mkdir triva-test-project
cd triva-test-project
npm init -y

# Install from the tarball
npm install /path/to/triva/triva-1.0.0.tgz
```

### Step 3: Test it (same as Method 1, steps 3-6)

---

## Method 3: Using Local Path (Simplest for Quick Tests)

### Direct install from path
```bash
# Create test project
mkdir triva-test-project
cd triva-test-project
npm init -y

# Install directly from local path
npm install /path/to/triva
```

---

## Method 4: Using Verdaccio (Local NPM Registry)

For the most realistic testing, run a local NPM registry.

### Step 1: Install Verdaccio
```bash
npm install -g verdaccio
```

### Step 2: Start Verdaccio
```bash
verdaccio
# Runs on http://localhost:4873
```

### Step 3: Publish to local registry
```bash
# In your triva directory
npm adduser --registry http://localhost:4873
npm publish --registry http://localhost:4873
```

### Step 4: Install from local registry
```bash
# In your test project
npm install triva --registry http://localhost:4873
```

---

## Automated Test Script

Here's a script that automates the entire testing process:

```bash
#!/bin/bash

# test-package.sh
set -e

echo "🧪 Testing Triva Package Locally"
echo "================================"

# Get the triva package directory
TRIVA_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📦 Triva directory: $TRIVA_DIR"

# Create temporary test directory
TEST_DIR="/tmp/triva-test-$$"
mkdir -p "$TEST_DIR"
echo "📁 Test directory: $TEST_DIR"

cd "$TEST_DIR"

# Initialize test project
echo "📝 Initializing test project..."
npm init -y

# Update package.json for ES modules
cat > package.json << EOF
{
  "name": "triva-test-project",
  "version": "1.0.0",
  "type": "module",
  "description": "Test project for Triva"
}
EOF

# Install triva from local path
echo "⬇️  Installing Triva from local path..."
npm install "$TRIVA_DIR"

# Create test file
echo "📄 Creating test file..."
cat > test.js << 'TESTEOF'
import { build, middleware, get, post, listen, log, cache, configCache } from 'triva';

console.log('✅ Import successful!');

build({ env: 'development' });

configCache({
  cache_data: true,
  cache_type: 'memory',
  cache_limit: 1000
});

middleware({
  retention: { enabled: true, maxEntries: 1000 },
  throttle: {
    limit: 10,
    window_ms: 60000,
    burst_limit: 5,
    burst_window_ms: 1000
  }
});

get('/test', (req, res) => {
  console.log('📨 Received request to /test');
  res.json({ message: 'Test successful!', timestamp: Date.now() });
});

get('/cache-test', async (req, res) => {
  await cache.set('test-key', { data: 'cached value' }, 10000);
  const value = await cache.get('test-key');
  res.json({ cached: value });
});

get('/logs', async (req, res) => {
  const logs = await log.get({ limit: 10 });
  res.json({ count: logs.length, logs });
});

post('/echo', async (req, res) => {
  const body = await req.json();
  res.json({ echo: body });
});

const server = listen(3333, () => {
  console.log('');
  console.log('🚀 Test server started!');
  console.log('📍 http://localhost:3333');
  console.log('');
  console.log('Test endpoints:');
  console.log('  GET  http://localhost:3333/test');
  console.log('  GET  http://localhost:3333/cache-test');
  console.log('  GET  http://localhost:3333/logs');
  console.log('  POST http://localhost:3333/echo');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
TESTEOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the test server:"
echo "  cd $TEST_DIR"
echo "  node test.js"
echo ""
echo "To test endpoints (in another terminal):"
echo "  curl http://localhost:3333/test"
echo "  curl http://localhost:3333/cache-test"
echo "  curl http://localhost:3333/logs"
echo "  curl -X POST http://localhost:3333/echo -H 'Content-Type: application/json' -d '{\"test\":\"data\"}'"
echo ""
echo "To clean up when done:"
echo "  rm -rf $TEST_DIR"
echo ""
TESTEOF

chmod +x test-package.sh
```

---

## Quick Test Commands

Once your test server is running, try these:

```bash
# Basic test
curl http://localhost:3000/test

# Test with query params
curl "http://localhost:3000/test?foo=bar&baz=qux"

# Test POST with JSON
curl -X POST http://localhost:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Triva"}'

# Test throttling (rapid requests)
for i in {1..15}; do 
  echo "Request $i:"
  curl http://localhost:3000/test
  echo ""
done

# Check logs
curl http://localhost:3000/logs

# Check cache stats
curl http://localhost:3000/cache/stats
```

---

## Running the Included Test Suite

```bash
# In your triva directory
node test.js

# Or with npm
npm test
```

---

## Checklist Before Publishing

- [ ] All tests pass (`npm test`)
- [ ] Example runs without errors (`node example.js`)
- [ ] Local test project works with `npm link`
- [ ] Package.json is correct (name, version, exports, etc.)
- [ ] README is complete and accurate
- [ ] TypeScript definitions are correct
- [ ] No sensitive data in package
- [ ] .gitignore and .npmignore are set
- [ ] License file is included
- [ ] Version number follows semver

---

## Common Issues and Solutions

### Issue: "Cannot find module 'triva'"
**Solution:** Make sure you've run `npm link` or installed correctly

### Issue: "SyntaxError: Cannot use import statement"
**Solution:** Add `"type": "module"` to package.json

### Issue: Changes not reflected
**Solution:** 
- With `npm link`: Just edit and rerun (changes are live)
- With `npm pack`: Recreate tarball and reinstall
- Clear Node's module cache: `rm -rf node_modules && npm install`

### Issue: Port already in use
**Solution:** Kill existing process or use different port
```bash
# Find process on port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

---

## Best Practice Workflow

1. **Develop** → Make changes to triva
2. **Test locally** → Use `npm link` for live testing
3. **Run test suite** → `npm test`
4. **Test as package** → `npm pack` and install in fresh project
5. **Final check** → Review all files to be published
6. **Publish** → `npm publish` (or to private registry first)
