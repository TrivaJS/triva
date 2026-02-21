/**
 * Routing Unit Tests
 * Tests routing logic, response helpers, settings API, isAI/isBot/isCrawler
 * Zero dependencies — Node.js built-in assert only
 */

import assert from 'assert';

// ─── helpers ────────────────────────────────────────────────────────────────

function extractParams(route, path) {
  const routeParts = route.split('/').filter(Boolean);
  const pathParts  = path.split('/').filter(Boolean);
  const params = {};
  routeParts.forEach((part, i) => {
    if (part.startsWith(':')) params[part.slice(1)] = pathParts[i];
  });
  return params;
}

function parseQuery(queryString) {
  if (!queryString || queryString === '?') return {};
  const query  = {};
  const params = new URLSearchParams(queryString);
  for (const [key, value] of params) {
    if (query[key]) {
      query[key] = Array.isArray(query[key])
        ? [...query[key], value]
        : [query[key], value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) {
      this.setHeader('Content-Type', 'application/json');
      this.body = JSON.stringify(data);
    },
    send(data) {
      this.setHeader('Content-Type', 'text/plain');
      this.body = data;
    },
    html(data) {
      this.setHeader('Content-Type', 'text/html');
      this.body = data;
    },
    redirect(url, code = 302) {
      this.statusCode = code;
      this.setHeader('Location', url);
    }
  };
}

// ─── isAI / isBot / isCrawler stubs (mirrors lib behaviour) ─────────────────

const AI_PATTERNS = [
  /GPTBot/i, /ChatGPT/i, /Anthropic/i, /Claude/i, /Gemini/i,
  /Google-Extended/i, /CCBot/i, /PerplexityBot/i, /YouBot/i,
  /Diffbot/i, /Cohere/i, /AI2Bot/i, /FacebookBot/i
];

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /headless/i,
  /Slurp/i, /DuckDuckBot/i, /Baiduspider/i, /YandexBot/i,
  /Sogou/i, /Exabot/i, /facebot/i, /ia_archiver/i
];

const CRAWLER_PATTERNS = [
  /Googlebot/i, /Bingbot/i, /Applebot/i, /Twitterbot/i,
  /LinkedInBot/i, /PinterestBot/i, /Slackbot/i, /WhatsApp/i,
  /Discordbot/i, /TelegramBot/i
];

function isAI(ua)      { return typeof ua === 'string' && AI_PATTERNS.some(r => r.test(ua)); }
function isBot(ua)     { return typeof ua === 'string' && BOT_PATTERNS.some(r => r.test(ua)); }
function isCrawler(ua) { return typeof ua === 'string' && CRAWLER_PATTERNS.some(r => r.test(ua)); }

// ─── tests ───────────────────────────────────────────────────────────────────

const tests = {
  // Route params
  'Route Parameters - extracts single parameter'() {
    const p = extractParams('/users/:id', '/users/123');
    assert.strictEqual(p.id, '123');
  },
  'Route Parameters - extracts multiple parameters'() {
    const p = extractParams('/users/:userId/posts/:postId', '/users/123/posts/456');
    assert.strictEqual(p.userId, '123');
    assert.strictEqual(p.postId, '456');
  },
  'Route Parameters - handles numeric parameters'() {
    const p = extractParams('/items/:id', '/items/42');
    assert.strictEqual(p.id, '42');
  },

  // Query strings
  'Query Strings - parses simple query'() {
    const q = parseQuery('?name=test&age=25');
    assert.strictEqual(q.name, 'test');
    assert.strictEqual(q.age, '25');
  },
  'Query Strings - handles empty query'() {
    assert.deepStrictEqual(parseQuery(''), {});
  },
  'Query Strings - handles array parameters'() {
    const q = parseQuery('?tags=js&tags=node&tags=web');
    assert.ok(Array.isArray(q.tags));
    assert.strictEqual(q.tags.length, 3);
    assert.strictEqual(q.tags[0], 'js');
  },

  // Response methods
  'Response Methods - sends JSON response'() {
    const res = createMockResponse();
    res.json({ test: true });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'application/json');
    assert.strictEqual(res.body, '{"test":true}');
  },
  'Response Methods - sets custom status code'() {
    const res = createMockResponse();
    res.status(404).json({ error: 'Not found' });
    assert.strictEqual(res.statusCode, 404);
  },
  'Response Methods - sends text response'() {
    const res = createMockResponse();
    res.send('Hello World');
    assert.strictEqual(res.headers['Content-Type'], 'text/plain');
    assert.strictEqual(res.body, 'Hello World');
  },
  'Response Methods - sends HTML response'() {
    const res = createMockResponse();
    res.html('<h1>Hello</h1>');
    assert.strictEqual(res.headers['Content-Type'], 'text/html');
    assert.strictEqual(res.body, '<h1>Hello</h1>');
  },
  'Response Methods - chains status and json'() {
    const res = createMockResponse();
    res.status(201).json({ created: true });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(JSON.parse(res.body).created, true);
  },
  'Response Methods - redirect sets Location header'() {
    const res = createMockResponse();
    res.redirect('https://example.com', 301);
    assert.strictEqual(res.statusCode, 301);
    assert.strictEqual(res.headers['Location'], 'https://example.com');
  },
  'Response Methods - redirect defaults to 302'() {
    const res = createMockResponse();
    res.redirect('/new-path');
    assert.strictEqual(res.statusCode, 302);
  },

  // isAI
  'isAI - returns true for GPTBot'() {
    assert.strictEqual(isAI('GPTBot/1.0'), true);
  },
  'isAI - returns true for Claude/Anthropic'() {
    assert.strictEqual(isAI('Claude-Web'), true);
    assert.strictEqual(isAI('Anthropic-AI'), true);
  },
  'isAI - returns true for Gemini'() {
    assert.strictEqual(isAI('Google Gemini'), true);
  },
  'isAI - returns false for regular browser'() {
    assert.strictEqual(isAI('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'), false);
  },
  'isAI - returns false for Googlebot (search crawler not AI)'() {
    assert.strictEqual(isAI('Googlebot/2.1'), false);
  },
  'isAI - returns false for empty string'() {
    assert.strictEqual(isAI(''), false);
  },
  'isAI - returns false for non-string'() {
    assert.strictEqual(isAI(null), false);
    assert.strictEqual(isAI(undefined), false);
  },

  // isBot
  'isBot - returns true for generic bot UA'() {
    assert.strictEqual(isBot('MyScraper-bot/1.0'), true);
  },
  'isBot - returns true for headless browser'() {
    assert.strictEqual(isBot('HeadlessChrome/120'), true);
  },
  'isBot - returns true for spider'() {
    assert.strictEqual(isBot('Spider-Agent/2.0'), true);
  },
  'isBot - returns false for regular browser'() {
    assert.strictEqual(isBot('Mozilla/5.0 Chrome/120'), false);
  },
  'isBot - returns false for empty string'() {
    assert.strictEqual(isBot(''), false);
  },

  // isCrawler
  'isCrawler - returns true for Googlebot'() {
    assert.strictEqual(isCrawler('Googlebot/2.1 (+http://www.google.com/bot.html)'), true);
  },
  'isCrawler - returns true for Bingbot'() {
    assert.strictEqual(isCrawler('bingbot/2.0'), true);
  },
  'isCrawler - returns true for Twitterbot'() {
    assert.strictEqual(isCrawler('Twitterbot/1.0'), true);
  },
  'isCrawler - returns true for Discordbot'() {
    assert.strictEqual(isCrawler('Discordbot/2.0'), true);
  },
  'isCrawler - returns false for regular browser'() {
    assert.strictEqual(isCrawler('Mozilla/5.0 Chrome/120'), false);
  },
  'isCrawler - returns false for GPTBot (AI not crawler)'() {
    assert.strictEqual(isCrawler('GPTBot/1.0'), false);
  },

  // UA-based middleware pattern (the pattern developers now use instead of redirects config)
  'UA helpers - developer can build redirect middleware with isAI'() {
    const logs = [];
    function makeRedirectMiddleware(dest) {
      return (req, res, next) => {
        if (isAI(req.headers['user-agent'])) {
          res.redirect(dest, 302);
          logs.push('redirected');
        } else {
          next();
        }
      };
    }

    const mw = makeRedirectMiddleware('https://ai.example.com');
    const req = { headers: { 'user-agent': 'GPTBot/1.0' } };
    const res = createMockResponse();
    let nextCalled = false;
    mw(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers['Location'], 'https://ai.example.com');
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(logs[0], 'redirected');
  },
  'UA helpers - regular browser passes through middleware'() {
    function makeRedirectMiddleware(dest) {
      return (req, res, next) => {
        if (isAI(req.headers['user-agent'])) {
          res.redirect(dest, 302);
        } else {
          next();
        }
      };
    }

    const mw = makeRedirectMiddleware('https://ai.example.com');
    const req = { headers: { 'user-agent': 'Mozilla/5.0 Chrome/120' } };
    const res = createMockResponse();
    let nextCalled = false;
    mw(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.headers['Location'], undefined);
  }
};

// ─── runner ──────────────────────────────────────────────────────────────────

function runTests() {
  console.log('🧪 Running Routing Tests\n');
  let passed = 0, failed = 0;

  for (const [name, test] of Object.entries(tests)) {
    try {
      test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
