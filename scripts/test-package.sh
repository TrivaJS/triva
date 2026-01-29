#!/bin/bash
# test-package.sh - Automated local package testing script for Triva
set -e

echo "🧪 Testing Triva Package Locally"
echo "================================"

# Get the triva package directory (where this script is located)
TRIVA_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📦 Triva directory: $TRIVA_DIR"

# Create temporary test directory
TEST_DIR="/tmp/triva-test-$$"
mkdir -p "$TEST_DIR"
echo "📁 Test directory: $TEST_DIR"

cd "$TEST_DIR"

# Initialize test project
echo "📝 Initializing test project..."
npm init -y > /dev/null 2>&1

# Update package.json for ES modules
cat > package.json << 'EOF'
{
  "name": "triva-test-project",
  "version": "1.0.0",
  "type": "module",
  "description": "Test project for Triva"
}
EOF

# Install triva from local path
echo "⬇️  Installing Triva from local path..."
npm install "$TRIVA_DIR" > /dev/null 2>&1

# Create comprehensive test file
echo "📄 Creating test file..."
cat > test.js << 'TESTEOF'
import { build, middleware, get, post, listen, log, cache, configCache } from 'triva';

console.log('✅ Triva imported successfully!');
console.log('');

// Initialize server
build({ env: 'development' });

// Configure cache
configCache({
  cache_data: true,
  cache_type: 'memory',
  cache_limit: 1000
});

// Configure middleware with throttling
middleware({
  retention: { enabled: true, maxEntries: 1000 },
  throttle: {
    limit: 10,
    window_ms: 60000,
    burst_limit: 5,
    burst_window_ms: 1000,
    ban_threshold: 3,
    ban_ms: 30000
  }
});

// Basic route
get('/test', (req, res) => {
  console.log('📨 GET /test');
  res.json({ 
    message: 'Test successful!', 
    timestamp: Date.now(),
    query: req.query
  });
});

// Route with params
get('/users/:id', (req, res) => {
  console.log('📨 GET /users/:id');
  res.json({ 
    userId: req.params.id,
    message: 'User retrieved'
  });
});

// Cache test route
get('/cache-test', async (req, res) => {
  console.log('📨 GET /cache-test');
  
  // Set a value
  await cache.set('test-key', { data: 'cached value', timestamp: Date.now() }, 10000);
  
  // Get it back
  const value = await cache.get('test-key');
  
  // Get cache stats
  const stats = await cache.stats();
  
  res.json({ 
    cached: value,
    stats
  });
});

// Logs route
get('/logs', async (req, res) => {
  console.log('📨 GET /logs');
  const logs = await log.get({ limit: 20 });
  res.json({ 
    count: logs.length, 
    logs 
  });
});

// Log stats route
get('/logs/stats', async (req, res) => {
  console.log('📨 GET /logs/stats');
  const stats = await log.getStats();
  res.json(stats);
});

// POST echo route
post('/echo', async (req, res) => {
  console.log('📨 POST /echo');
  try {
    const body = await req.json();
    res.json({ 
      echo: body,
      received: Date.now()
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

// Health check
get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Throttle test (will get throttled after a few requests)
get('/throttle-test', (req, res) => {
  console.log('📨 GET /throttle-test (testing rate limits)');
  res.json({ 
    message: 'This endpoint has rate limiting',
    throttle: req.triva?.throttle
  });
});

// Start server
const server = listen(3333, () => {
  console.log('🚀 Test server started successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📍 Server: http://localhost:3333');
  console.log('');
  console.log('🧪 Test Endpoints:');
  console.log('  GET  http://localhost:3333/test');
  console.log('  GET  http://localhost:3333/test?foo=bar');
  console.log('  GET  http://localhost:3333/users/123');
  console.log('  GET  http://localhost:3333/cache-test');
  console.log('  GET  http://localhost:3333/logs');
  console.log('  GET  http://localhost:3333/logs/stats');
  console.log('  GET  http://localhost:3333/health');
  console.log('  GET  http://localhost:3333/throttle-test');
  console.log('  POST http://localhost:3333/echo');
  console.log('');
  console.log('💡 Quick Tests:');
  console.log('  curl http://localhost:3333/test');
  console.log('  curl http://localhost:3333/cache-test');
  console.log('  curl -X POST http://localhost:3333/echo -H "Content-Type: application/json" -d \'{"test":"data"}\'');
  console.log('');
  console.log('⚡ Throttle Test (run multiple times):');
  console.log('  for i in {1..10}; do curl http://localhost:3333/throttle-test; echo ""; done');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
TESTEOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 Test project location: $TEST_DIR"
echo ""
echo "To start the test server:"
echo "  cd $TEST_DIR"
echo "  node test.js"
echo ""
echo "Or run directly:"
echo "  cd $TEST_DIR && node test.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask if user wants to start server now
read -p "Start test server now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🚀 Starting test server..."
    echo ""
    cd "$TEST_DIR"
    node test.js
fi
