/**
 * Basic Triva Example
 * Shows fundamental usage of Triva framework
 */

import { build, get, post, put, del, listen } from '../../lib/index.js';

async function main() {
  console.log('🚀 Starting Basic Triva Example...\n');

  // Build with minimal configuration
  await build({
    env: 'development',
    cache: {
      type: 'memory',
      retention: 3600000 // 1 hour
    },
    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  console.log('✅ Triva built successfully!\n');

  // Basic GET route
  get('/', (req, res) => {
    res.json({
      message: 'Hello from Triva!',
      timestamp: new Date().toISOString()
    });
  });

  // Route with parameters
  get('/users/:id', (req, res) => {
    res.json({
      userId: req.params.id,
      message: `Fetching user ${req.params.id}`
    });
  });

  // POST route
  post('/users', async (req, res) => {
    const body = await req.json();
    res.status(201).json({
      message: 'User created',
      data: body
    });
  });

  // PUT route
  put('/users/:id', async (req, res) => {
    const body = await req.json();
    res.json({
      message: `User ${req.params.id} updated`,
      data: body
    });
  });

  // DELETE route
  del('/users/:id', (req, res) => {
    res.json({
      message: `User ${req.params.id} deleted`
    });
  });

  // Error handling example
  get('/error', (req, res) => {
    throw new Error('This is a test error');
  });

  const port = 3000;
  listen(port);

  console.log(`\n📡 Server running on http://localhost:${port}`);
  console.log('\n📝 Try these endpoints:');
  console.log(`   GET  http://localhost:${port}/`);
  console.log(`   GET  http://localhost:${port}/users/123`);
  console.log(`   POST http://localhost:${port}/users`);
  console.log(`   PUT  http://localhost:${port}/users/123`);
  console.log(`   DELETE http://localhost:${port}/users/123`);
  console.log(`   GET  http://localhost:${port}/error (test error tracking)`);
}

main().catch(console.error);
