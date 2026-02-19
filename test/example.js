/**
 * Triva Example Server
 * Demonstrates the full API: class-based build, routing, middleware,
 * isAI / isBot / isCrawler UA helpers, settings, cookieParser
 */

import {
  build,
  use,
  get,
  post,
  all,
  route,
  listen,
  cookieParser,
  isAI,
  isBot,
  isCrawler
} from 'triva';

console.log('🚀 Triva Example Server\n');

// ─── Build ────────────────────────────────────────────────────────────────────

await build({
  env:   'development',
  cache: { type: 'memory', retention: 600000 },
  throttle: {
    limit:     100,
    window_ms: 60000
  },
  retention:     { enabled: true, maxEntries: 1000 },
  errorTracking: { enabled: true }
});

// ─── Middleware ───────────────────────────────────────────────────────────────

use(cookieParser());

// Request logger
use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// UA-based redirect middleware (replaces the old redirects: {} config)
// Developers compose this with isAI / isBot / isCrawler — no config overhead.
use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  if (isAI(ua)) {
    // Route AI scrapers to a dedicated endpoint or external site
    return res.redirect('https://ai.example.com' + req.url, 302);
  }

  if (isCrawler(ua) && req.url.startsWith('/private')) {
    return res.status(403).json({ error: 'Crawlers are not permitted here' });
  }

  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

get('/', (req, res) => {
  res.json({
    message: 'Triva is working!',
    endpoints: {
      '/':            'This page',
      '/hello':       'Say hello',
      '/users/:id':   'Get user by ID',
      '/cookies/set': 'Set a cookie',
      '/cookies/get': 'Get cookies',
      '/ua':          'Detect UA type',
      '/any':         'Matches any method'
    }
  });
});

get('/hello', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
});

get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id, name: 'Test User' });
});

get('/cookies/set', (req, res) => {
  res.cookie('test', 'value123', { maxAge: 3600000 });
  res.json({ message: 'Cookie set' });
});

get('/cookies/get', (req, res) => {
  res.json({ message: 'Your cookies', cookies: req.cookies });
});

// UA detection endpoint — lets developers query isAI/isBot/isCrawler directly
get('/ua', (req, res) => {
  const ua = req.query.ua || req.headers['user-agent'] || '';
  res.json({
    ua,
    isAI:      isAI(ua),
    isBot:     isBot(ua),
    isCrawler: isCrawler(ua)
  });
});

post('/echo', async (req, res) => {
  const body = await req.json();
  res.json({ echo: body });
});

// all() — responds to every HTTP method on this path
all('/any', (req, res) => {
  res.json({ method: req.method, message: 'Matched via all()' });
});

// route() chaining
route('/resource')
  .get((req, res)    => res.json({ action: 'list' }))
  .post((req, res)   => res.json({ action: 'create' }))
  .put((req, res)    => res.json({ action: 'replace' }))
  .patch((req, res)  => res.json({ action: 'update' }))
  .del((req, res)    => res.json({ action: 'delete' }));

// Variadic handlers
const authCheck = (req, res, next) => {
  req.authenticated = !!req.cookies.admin_token;
  next();
};
const requireAuth = (req, res, next) => {
  if (!req.authenticated) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

get('/private/data', authCheck, requireAuth, (req, res) => {
  res.json({ secret: 'data', authenticated: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

listen(3000, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Server running on http://localhost:3000');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nTry:');
  console.log('  curl http://localhost:3000');
  console.log('  curl http://localhost:3000/hello?name=Triva');
  console.log('  curl http://localhost:3000/users/123');
  console.log('  curl "http://localhost:3000/ua?ua=GPTBot/1.0"');
  console.log('  curl http://localhost:3000/any -X DELETE');
  console.log('');
});
