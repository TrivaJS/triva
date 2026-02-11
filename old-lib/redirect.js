/*!
 * Triva - Auto-Redirect Middleware
 * Intelligent traffic redirection for AI, bots, and crawlers
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

/**
 * User-Agent patterns for detecting AI, bot, and crawler traffic.
 * Regularly updated to catch new AI services and bot patterns.
 */
const AI_PATTERNS = [
  // AI/LLM Services
  /GPTBot/i,                    // OpenAI
  /ChatGPT-User/i,              // ChatGPT
  /Claude-Web/i,                // Anthropic Claude
  /anthropic-ai/i,              // Anthropic
  /Google-Extended/i,           // Google Bard/Gemini
  /cohere-ai/i,                 // Cohere
  /PerplexityBot/i,             // Perplexity
  /YouBot/i,                    // You.com
  /AI2Bot/i,                    // AI2 (Allen Institute)
  /Applebot-Extended/i,         // Apple AI
  /CCBot/i,                     // Common Crawl (used by AI training)
  /FacebookBot/i,               // Meta AI
  /Diffbot/i,                   // Diffbot
  /omgili/i,                    // Omgili (AI training)
];

const BOT_PATTERNS = [
  // Search Engine Bots
  /Googlebot/i,
  /bingbot/i,
  /Slurp/i,                     // Yahoo
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /Sogou/i,
  /Exabot/i,
  
  // SEO & Analytics Bots
  /AhrefsBot/i,
  /SEMrushBot/i,
  /MJ12bot/i,                   // Majestic
  /DotBot/i,                    // Moz
  /Screaming Frog/i,
  /SiteAuditBot/i,
  
  // Social Media Bots
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /Slackbot/i,
  /TelegramBot/i,
  /WhatsApp/i,
  /SkypeUriPreview/i,
  
  // Generic Bot Patterns
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
];

const CRAWLER_PATTERNS = [
  // Archive & Wayback
  /archive\.org_bot/i,
  /Wayback/i,
  /ArchiveBot/i,
  
  // Monitoring & Uptime
  /Pingdom/i,
  /UptimeRobot/i,
  /StatusCake/i,
  /Zabbix/i,
  /Datadog/i,
  
  // Security Scanners
  /Nmap/i,
  /Nikto/i,
  /sqlmap/i,
  /masscan/i,
  
  // Generic Crawlers
  /Wget/i,
  /curl/i,
  /Python-urllib/i,
  /Python-requests/i,
  /Java\//i,
  /Apache-HttpClient/i,
];

/**
 * Redirect configuration for automatic traffic routing.
 * 
 * @typedef {Object} RedirectConfig
 * @property {boolean} [enabled=false] - Enable/disable auto-redirect
 * @property {boolean} [redirectAI=false] - Redirect AI/LLM traffic
 * @property {boolean} [redirectBots=false] - Redirect bot traffic
 * @property {boolean} [redirectCrawlers=false] - Redirect crawler traffic
 * @property {string|Function} destination - Where to redirect (URL or function)
 * @property {number} [statusCode=302] - HTTP redirect status code (301, 302, 307, 308)
 * @property {Array<Object>} [customRules=[]] - Custom redirect rules
 * @property {Array<string>} [whitelist=[]] - User-Agent patterns to never redirect
 * @property {boolean} [bypassThrottle=true] - Skip throttling for redirected traffic
 * @property {boolean} [logRedirects=false] - Log all redirects for debugging
 * 
 * @example
 * // Simple redirect
 * {
 *   enabled: true,
 *   redirectAI: true,
 *   destination: 'https://ai.example.com'
 * }
 * 
 * @example
 * // Dynamic redirect based on request
 * {
 *   enabled: true,
 *   redirectBots: true,
 *   destination: (req) => {
 *     if (req.url.includes('/api/')) {
 *       return 'https://bot-api.example.com' + req.url;
 *     }
 *     return 'https://bots.example.com';
 *   }
 * }
 * 
 * @example
 * // Custom rules with conditions
 * {
 *   enabled: true,
 *   customRules: [
 *     {
 *       name: 'Block scrapers from admin',
 *       condition: (req) => req.url.startsWith('/admin'),
 *       userAgentPattern: /scraper/i,
 *       destination: '/forbidden',
 *       statusCode: 403
 *     },
 *     {
 *       name: 'Redirect old API to new',
 *       condition: (req) => req.headers['user-agent']?.includes('OldClient'),
 *       destination: (req) => '/v2' + req.url,
 *       statusCode: 301
 *     }
 *   ]
 * }
 */

/**
 * Custom redirect rule definition.
 * 
 * @typedef {Object} CustomRule
 * @property {string} name - Rule name for debugging
 * @property {Function} condition - Function that returns true if rule should apply
 * @property {RegExp} [userAgentPattern] - Optional User-Agent pattern to match
 * @property {string|Function} destination - Redirect destination
 * @property {number} [statusCode=302] - HTTP status code for redirect
 * @property {boolean} [bypassThrottle=true] - Skip throttling if matched
 */

/**
 * Checks if a User-Agent matches any pattern in an array.
 * 
 * @param {string} userAgent - User-Agent string to test
 * @param {Array<RegExp>} patterns - Array of regex patterns
 * @returns {boolean} True if any pattern matches
 */
function matchesPattern(userAgent, patterns) {
  if (!userAgent) return false;
  return patterns.some(pattern => pattern.test(userAgent));
}

/**
 * Checks if a User-Agent is whitelisted.
 * 
 * @param {string} userAgent - User-Agent string to test
 * @param {Array<string|RegExp>} whitelist - Whitelist patterns
 * @returns {boolean} True if whitelisted
 */
function isWhitelisted(userAgent, whitelist) {
  if (!userAgent || !whitelist || whitelist.length === 0) return false;
  
  return whitelist.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(userAgent);
    }
    return userAgent.includes(pattern);
  });
}

/**
 * Creates auto-redirect middleware for intelligent traffic routing.
 * Detects and redirects AI, bot, and crawler traffic based on User-Agent.
 * Bypasses throttling and weighting for redirected traffic.
 * 
 * @param {RedirectConfig} config - Redirect configuration
 * @returns {Function} Express-style middleware function
 * 
 * @example
 * import { build } from 'triva';
 * import { createRedirectMiddleware } from 'triva/lib/redirect.js';
 * 
 * await build({
 *   redirects: {
 *     enabled: true,
 *     redirectAI: true,
 *     redirectBots: true,
 *     destination: 'https://bots.example.com',
 *     whitelist: ['GoogleBot', 'BingBot'], // Allow these bots
 *     logRedirects: true
 *   }
 * });
 */
function createRedirectMiddleware(config = {}) {
  const {
    enabled = false,
    redirectAI = false,
    redirectBots = false,
    redirectCrawlers = false,
    destination,
    statusCode = 302,
    customRules = [],
    whitelist = [],
    bypassThrottle = true,
    logRedirects = false
  } = config;

  // Validate configuration
  if (enabled && !destination && customRules.length === 0) {
    throw new Error('Redirect middleware requires either "destination" or "customRules"');
  }

  if (destination && typeof destination !== 'string' && typeof destination !== 'function') {
    throw new Error('Redirect destination must be a string or function');
  }

  /**
   * Middleware function that handles redirect logic.
   * 
   * @param {Object} req - Enhanced request object
   * @param {Object} res - Enhanced response object
   * @param {Function} next - Next middleware function
   */
  return function redirectMiddleware(req, res, next) {
    // Skip if disabled
    if (!enabled) {
      return next();
    }

    const userAgent = req.headers['user-agent'] || '';

    // Check whitelist first
    if (isWhitelisted(userAgent, whitelist)) {
      return next();
    }

    let shouldRedirect = false;
    let redirectUrl = null;
    let redirectStatus = statusCode;
    let matchedRule = null;

    // Check custom rules first (highest priority)
    for (const rule of customRules) {
      try {
        const conditionMet = rule.condition(req);
        
        if (conditionMet) {
          // Check User-Agent pattern if specified
          if (rule.userAgentPattern) {
            if (!rule.userAgentPattern.test(userAgent)) {
              continue;
            }
          }

          shouldRedirect = true;
          matchedRule = rule.name;
          redirectStatus = rule.statusCode || statusCode;
          
          // Get destination (may be function)
          if (typeof rule.destination === 'function') {
            redirectUrl = rule.destination(req);
          } else {
            redirectUrl = rule.destination;
          }

          // Mark for throttle bypass if configured
          if (rule.bypassThrottle !== false) {
            req.triva = req.triva || {};
            req.triva.bypassThrottle = true;
          }

          break; // Use first matching rule
        }
      } catch (error) {
        console.error(`Error evaluating custom rule "${rule.name}":`, error.message);
      }
    }

    // If no custom rule matched, check built-in patterns
    if (!shouldRedirect) {
      const isAI = redirectAI && matchesPattern(userAgent, AI_PATTERNS);
      const isBot = redirectBots && matchesPattern(userAgent, BOT_PATTERNS);
      const isCrawler = redirectCrawlers && matchesPattern(userAgent, CRAWLER_PATTERNS);

      shouldRedirect = isAI || isBot || isCrawler;

      if (shouldRedirect) {
        // Determine destination
        if (typeof destination === 'function') {
          redirectUrl = destination(req);
        } else {
          redirectUrl = destination;
        }

        // Mark for throttle bypass
        if (bypassThrottle) {
          req.triva = req.triva || {};
          req.triva.bypassThrottle = true;
        }

        // Log which category matched
        if (logRedirects) {
          const category = isAI ? 'AI' : isBot ? 'Bot' : 'Crawler';
          matchedRule = `Built-in ${category} detection`;
        }
      }
    }

    // Perform redirect if needed
    if (shouldRedirect && redirectUrl) {
      if (logRedirects) {
        console.log(`[Redirect] ${userAgent} → ${redirectUrl} (${matchedRule || 'auto'})`);
      }

      res.statusCode = redirectStatus;
      res.setHeader('Location', redirectUrl);
      res.end();
      return;
    }

    // Continue to next middleware
    next();
  };
}

/**
 * Helper function to create a custom redirect rule.
 * 
 * @param {string} name - Rule name for debugging
 * @param {Function} condition - Condition function
 * @param {string|Function} destination - Redirect destination
 * @param {Object} [options={}] - Additional options
 * @returns {CustomRule} Custom rule object
 * 
 * @example
 * import { createRule } from 'triva/lib/redirect.js';
 * 
 * const rule = createRule(
 *   'Block admin scrapers',
 *   (req) => req.url.startsWith('/admin') && /scraper/i.test(req.headers['user-agent']),
 *   '/forbidden',
 *   { statusCode: 403 }
 * );
 */
function createRule(name, condition, destination, options = {}) {
  return {
    name,
    condition,
    destination,
    statusCode: options.statusCode || 302,
    userAgentPattern: options.userAgentPattern,
    bypassThrottle: options.bypassThrottle !== false
  };
}

export { 
  createRedirectMiddleware,
  createRule,
  AI_PATTERNS,
  BOT_PATTERNS,
  CRAWLER_PATTERNS
};
