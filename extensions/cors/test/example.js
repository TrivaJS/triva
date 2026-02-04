/**
 * @trivajs/cors - Usage Example
 * Demonstrates various CORS configurations with Triva
 */

// NOTE: This example assumes Triva is installed
// To run: npm install triva @trivajs/cors
// Then: node test/example.js

import { build, get, post, use, listen } from 'triva';
import { cors, corsDevMode, corsStrict, corsMultiOrigin, corsDynamic } from '../lib/index.js';

async function main() {
  console.log('🚀 Starting CORS Example Server\n');

  await build({
    cache: { type: 'memory' }
  });

  // Example 1: Basic CORS (allow all origins)
  console.log('✅ Route 1: /api/public - Allow all origins');
  get('/api/public', use(cors()), (req, res) => {
    res.json({ 
      message: 'Public endpoint - all origins allowed',
      origin: req.headers.origin || 'none'
    });
  });

  // Example 2: Development mode (very permissive)
  console.log('✅ Route 2: /api/dev - Development mode (allow all)');
  get('/api/dev', use(corsDevMode()), (req, res) => {
    res.json({ 
      message: 'Development mode - all origins, methods, headers allowed',
      mode: 'dev'
    });
  });

  // Example 3: Strict mode (single origin)
  console.log('✅ Route 3: /api/strict - Strict mode (single origin)');
  get('/api/strict', use(corsStrict('https://app.example.com')), (req, res) => {
    res.json({ 
      message: 'Strict mode - only https://app.example.com allowed',
      credentials: true
    });
  });

  // Example 4: Multiple origins
  console.log('✅ Route 4: /api/multi - Multiple allowed origins');
  get('/api/multi', use(corsMultiOrigin([
    'https://app1.example.com',
    'https://app2.example.com',
    'https://admin.example.com'
  ])), (req, res) => {
    res.json({ 
      message: 'Multi-origin mode - 3 origins allowed',
      allowedOrigins: 3
    });
  });

  // Example 5: Dynamic validation
  console.log('✅ Route 5: /api/dynamic - Dynamic origin validation');
  get('/api/dynamic', use(corsDynamic((origin) => {
    // Allow any subdomain of trusted-domain.com
    return origin && origin.endsWith('.trusted-domain.com');
  })), (req, res) => {
    res.json({ 
      message: 'Dynamic validation - *.trusted-domain.com allowed',
      validator: 'subdomain check'
    });
  });

  // Example 6: Custom configuration
  console.log('✅ Route 6: /api/custom - Custom CORS configuration');
  get('/api/custom', use(cors({
    origin: 'https://custom.example.com',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Custom-Header'],
    exposedHeaders: ['X-Total-Count', 'X-RateLimit'],
    credentials: true,
    maxAge: 7200
  })), (req, res) => {
    res.setHeader('X-Total-Count', '100');
    res.setHeader('X-RateLimit', '1000');
    res.json({ 
      message: 'Custom CORS configuration',
      config: 'full control'
    });
  });

  // Example 7: RegExp pattern
  console.log('✅ Route 7: /api/pattern - RegExp pattern matching');
  get('/api/pattern', use(cors({
    origin: /^https:\/\/.*\.example\.com$/
  })), (req, res) => {
    res.json({ 
      message: 'Pattern matching - all *.example.com subdomains',
      pattern: '^https://.*\\.example\\.com$'
    });
  });

  // Example 8: POST with CORS (handles preflight)
  console.log('✅ Route 8: POST /api/data - POST with CORS preflight');
  post('/api/data', use(cors({
    origin: 'https://app.example.com',
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })), async (req, res) => {
    const body = await req.json();
    res.json({ 
      message: 'Data received with CORS',
      received: body
    });
  });

  // Example 9: Global CORS for all routes
  console.log('✅ Global: All other routes - Global CORS middleware');
  use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }));

  get('/api/global', (req, res) => {
    res.json({ 
      message: 'Global CORS applied',
      scope: 'all routes'
    });
  });

  const port = 3000;
  listen(port);

  console.log(`\n📡 Server running on http://localhost:${port}\n`);
  console.log('📝 Test endpoints:\n');
  console.log(`   GET  http://localhost:${port}/api/public`);
  console.log(`   GET  http://localhost:${port}/api/dev`);
  console.log(`   GET  http://localhost:${port}/api/strict`);
  console.log(`   GET  http://localhost:${port}/api/multi`);
  console.log(`   GET  http://localhost:${port}/api/dynamic`);
  console.log(`   GET  http://localhost:${port}/api/custom`);
  console.log(`   GET  http://localhost:${port}/api/pattern`);
  console.log(`   POST http://localhost:${port}/api/data`);
  console.log(`   GET  http://localhost:${port}/api/global`);
  console.log('\n💡 Test CORS headers with:');
  console.log('   curl -H "Origin: https://app.example.com" http://localhost:3000/api/strict\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
