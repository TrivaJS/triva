/**
 * Basic Triva Example
 * Demonstrates core routing with the class-based API
 */

import { build, isAI, isBot, isCrawler } from '../lib/index.js';

async function main() {
  console.log('🚀 Starting Basic Triva Example...\n');

  const instanceBuild = new build({
    env:   'development',
    cache: { type: 'memory', retention: 3600000 },
    throttle: { limit: 100, window_ms: 60000 }
  });

  console.log('✅ Triva built successfully!\n');

  // Basic routes
  instanceBuild.get('/', (req, res) => {
    res.json({ message: 'Hello from Triva!', timestamp: new Date().toISOString() });
  });

  instanceBuild.get('/users/:id', (req, res) => {
    res.json({ userId: req.params.id, message: `Fetching user ${req.params.id}` });
  });

  instanceBuild.post('/users', async (req, res) => {
    const body = await req.json();
    res.status(201).json({ message: 'User created', data: body });
  });

  instanceBuild.put('/users/:id', async (req, res) => {
    const body = await req.json();
    res.json({ message: `User ${req.params.id} updated`, data: body });
  });

  instanceBuild.delete('/users/:id', (req, res) => {
    res.json({ message: `User ${req.params.id} deleted` });
  });

  // all() — any HTTP method
  instanceBuild.all('/ping', (req, res) => {
    res.json({ pong: true, method: req.method });
  });

  // route() chaining
  instanceBuild.route('/api/items')
    .get((req, res)   => res.json({ items: [] }))
    .post(async (req, res) => {
      const body = await req.json();
      res.status(201).json({ created: body });
    });

  // Variadic middleware handlers
  const log = (req, res, next) => { req.logged = true; next(); };
  instanceBuild.get('/logged', log, (req, res) => {
    res.json({ logged: req.logged });
  });

  // Array handlers
  instanceBuild.get('/array-handlers', [log, log], (req, res) => {
    res.json({ logged: req.logged });
  });

  // UA detection — developer-built redirect using isAI
  instanceBuild.get('/ua-check', async (req, res) => {
    const ua = req.query.ua || req.headers['user-agent'] || '';
    res.json({ ua, isAI: await isAI(ua), isBot: await isBot(ua), isCrawler: await isCrawler(ua) });
  });

  instanceBuild.get('/error', (req, res) => {
    throw new Error('This is a test error');
  });

  const port = 3000;
  instanceBuild.listen(port);

  console.log(`\n📡 Server running on http://localhost:${port}`);
  console.log('\n📝 Try these endpoints:');
  console.log(`   GET    http://localhost:${port}/`);
  console.log(`   GET    http://localhost:${port}/users/123`);
  console.log(`   POST   http://localhost:${port}/users`);
  console.log(`   GET    http://localhost:${port}/ping`);
  console.log(`   DELETE http://localhost:${port}/ping`);
  console.log(`   GET    http://localhost:${port}/api/items`);
  console.log(`   GET    "http://localhost:${port}/ua-check?ua=GPTBot/1.0"`);
}

main().catch(console.error);
