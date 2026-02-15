/**
 * Auto-Redirect Example
 * Demonstrates intelligent traffic routing for AI, bots, and crawlers
 */

import { build, get, listen } from '../lib/index.js';

async function main() {
  // Example 1: Simple redirect for AI traffic
  await build({
    env: 'production',

    // Redirect AI/LLM traffic to specialized endpoint
    redirects: {
      enabled: true,
      redirectAI: true,              // Redirect GPTBot, Claude, etc.
      redirectBots: false,           // Allow search bots
      redirectCrawlers: false,       // Allow crawlers
      destination: 'https://ai.example.com',
      statusCode: 302,
      whitelist: ['Googlebot', 'Bingbot'],  // Never redirect these
      bypassThrottle: true,          // Skip throttling for redirected traffic
      logRedirects: true             // Log for debugging
    },

    // Throttling still applies to non-redirected traffic
    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  get('/', (req, res) => {
    res.json({ message: 'Main site - no AI traffic here!' });
  });

  get('/api/data', (req, res) => {
    res.json({ data: [1, 2, 3] });
  });

  listen(3000);
  console.log('✅ Server running with AI redirect on port 3000');
}

// Example 2: Dynamic redirects based on request
async function dynamicExample() {
  await build({
    redirects: {
      enabled: true,
      redirectAI: true,
      destination: (req) => {
        // Route AI traffic based on path
        if (req.url.startsWith('/api/')) {
          return 'https://ai-api.example.com' + req.url;
        }
        return 'https://ai-content.example.com';
      },
      logRedirects: true
    }
  });
}

// Example 3: Custom redirect rules
async function customRulesExample() {
  await build({
    redirects: {
      enabled: true,
      customRules: [
        // Rule 1: Block scrapers from admin area
        {
          name: 'Block admin scrapers',
          condition: (req) => {
            return req.url.startsWith('/admin') &&
                   /scraper|bot|crawler/i.test(req.headers['user-agent']);
          },
          destination: '/forbidden',
          statusCode: 403,
          bypassThrottle: false  // Still apply throttling
        },

        // Rule 2: Redirect old API clients
        {
          name: 'Redirect legacy clients',
          condition: (req) => {
            return req.headers['user-agent']?.includes('OldClient/1.0');
          },
          destination: (req) => '/v2' + req.url,
          statusCode: 301  // Permanent redirect
        },

        // Rule 3: Route AI requests to separate infrastructure
        {
          name: 'AI infrastructure routing',
          condition: (req) => /GPTBot|Claude|Gemini/i.test(req.headers['user-agent']),
          destination: (req) => {
            const url = new URL(req.url, 'https://example.com');
            return 'https://ai-backend.example.com' + url.pathname + url.search;
          },
          statusCode: 307,  // Temporary redirect (preserve method)
          bypassThrottle: true
        },

        // Rule 4: Detect unusual patterns
        {
          name: 'Unusual traffic patterns',
          condition: (req) => {
            // Check for rapid requests or suspicious patterns
            const suspiciousPatterns = [
              /SELECT.*FROM/i,      // SQL injection attempt
              /<script>/i,          // XSS attempt
              /\.\.\/\.\.\//,       // Path traversal
            ];

            return suspiciousPatterns.some(pattern =>
              pattern.test(req.url) || pattern.test(req.headers['user-agent'])
            );
          },
          destination: '/security-warning',
          statusCode: 403
        }
      ],

      // Fallback: redirect other bots
      redirectBots: true,
      destination: 'https://bots.example.com',
      logRedirects: true
    },

    throttle: {
      limit: 100,
      window_ms: 60000
    }
  });

  get('/', (req, res) => {
    res.json({ message: 'Protected with custom rules' });
  });

  get('/forbidden', (req, res) => {
    res.status(403).json({ error: 'Access denied' });
  });

  get('/security-warning', (req, res) => {
    res.status(403).json({
      error: 'Suspicious activity detected',
      message: 'Your request has been logged'
    });
  });

  listen(3001);
  console.log('✅ Server with custom rules on port 3001');
}

// Example 4: Per-category routing
async function categoryRoutingExample() {
  await build({
    redirects: {
      enabled: true,
      redirectAI: true,
      redirectBots: true,
      redirectCrawlers: true,

      // Different destinations based on detection
      destination: (req) => {
        const ua = req.headers['user-agent'] || '';

        // AI traffic → AI-specific infrastructure
        if (/GPTBot|Claude|Gemini|Anthropic/i.test(ua)) {
          return 'https://ai.example.com' + req.url;
        }

        // Search bots → SEO-optimized version
        if (/Googlebot|Bingbot|Baiduspider/i.test(ua)) {
          return 'https://seo.example.com' + req.url;
        }

        // Archive crawlers → static version
        if (/archive\.org|Wayback/i.test(ua)) {
          return 'https://static.example.com' + req.url;
        }

        // Default bot destination
        return 'https://bots.example.com';
      },

      statusCode: 302,
      bypassThrottle: true,
      logRedirects: true
    }
  });
}

// Run main example
main().catch(console.error);

// Comment to hide these examples:
dynamicExample().catch(console.error);
customRulesExample().catch(console.error);
categoryRoutingExample().catch(console.error);
