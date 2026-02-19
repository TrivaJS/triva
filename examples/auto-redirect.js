/**
 * Auto-Redirect Example
 * Demonstrates how to build traffic routing with isAI / isBot / isCrawler
 * instead of the old redirects:{} config block.
 *
 * These three helpers accept a UA string and return a boolean — making
 * middleware composition trivial.
 */

import { build, get, use, listen, isAI, isBot, isCrawler } from '../lib/index.js';

// ─── Example 1: Redirect all AI scrapers ─────────────────────────────────────

async function main() {
  await build({
    env:      'production',
    throttle: { limit: 100, window_ms: 60000 }
  });

  // Build your own redirect middleware in a few lines
  use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';

    if (isAI(ua)) {
      // Permanent redirect to AI-dedicated infrastructure
      return res.redirect('https://ai.example.com' + req.url, 302);
    }

    next();
  });

  get('/', (req, res) => {
    res.json({ message: 'Main site — no AI traffic here!' });
  });

  get('/api/data', (req, res) => {
    res.json({ data: [1, 2, 3] });
  });

  listen(3000);
  console.log('✅ Server running with AI redirect on port 3000');
}

// ─── Example 2: Per-category routing ─────────────────────────────────────────

async function categoryRoutingExample() {
  await build({ env: 'production' });

  use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';

    if (isAI(ua)) {
      return res.redirect('https://ai.example.com' + req.url, 302);
    }

    if (isCrawler(ua)) {
      // Route search bots to an SEO-optimised version
      return res.redirect('https://seo.example.com' + req.url, 302);
    }

    if (isBot(ua)) {
      return res.redirect('https://bots.example.com' + req.url, 302);
    }

    next();
  });
}

// ─── Example 3: Path-aware UA routing ────────────────────────────────────────

async function pathAwareExample() {
  await build({ env: 'production' });

  use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';

    if (isAI(ua)) {
      // Route AI to different backend based on path
      const dest = req.url.startsWith('/api/')
        ? 'https://ai-api.example.com' + req.url
        : 'https://ai-content.example.com';
      return res.redirect(dest, 302);
    }

    // Allow bots through but flag them on req
    if (isBot(ua))     req.isBot     = true;
    if (isCrawler(ua)) req.isCrawler = true;

    next();
  });

  get('/api/data', (req, res) => {
    res.json({
      data:      [1, 2, 3],
      isBot:     !!req.isBot,
      isCrawler: !!req.isCrawler
    });
  });
}

// ─── Example 4: Admin protection from bots ───────────────────────────────────

async function adminProtectionExample() {
  await build({ env: 'production' });

  use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';

    if ((isBot(ua) || isCrawler(ua)) && req.url.startsWith('/admin')) {
      return res.status(403).json({ error: 'Bots not permitted on admin endpoints' });
    }

    next();
  });

  get('/admin/dashboard', (req, res) => {
    res.json({ message: 'Admin dashboard — human users only' });
  });
}

// Run main example
main().catch(console.error);
