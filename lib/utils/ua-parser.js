/*!
 * Triva - User Agent Parser
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

"use strict";

async function parseUA(input) {
    const ua =
        typeof input === "string"
            ? input
            : input?.["user-agent"] || "";

    const lowerUA = ua.toLowerCase();

    const result = {
        ua,
        browser: { name: null, version: null, major: null },
        engine: { name: null },
        os: { name: null, version: null },
        device: { type: "desktop", model: null },
        cpu: { architecture: null },
        bot: {
            isBot: false,
            isAI: false,
            isCrawler: false,
            name: null,
            category: null
        }
    };

    /* ---------------------------------------------
     * BOT / AI DETECTION
     * ------------------------------------------- */

    const botSignatures = [
        { name: "GPTBot", match: /gptbot/, category: "ai-crawler" },
        { name: "ClaudeBot", match: /claudebot/, category: "ai-crawler" },
        { name: "PerplexityBot", match: /perplexity/, category: "ai-crawler" },
        { name: "Googlebot", match: /googlebot/, category: "search" },
        { name: "Bingbot", match: /bingbot/, category: "search" },
        { name: "Generic Bot", match: /bot|crawler|spider|curl|wget|python/i, category: "generic" }
    ];

    for (const bot of botSignatures) {
        if (bot.match.test(lowerUA)) {
            result.bot.isBot = true;
            result.bot.isCrawler = true;
            result.bot.isAI = bot.category.includes("ai");
            result.bot.name = bot.name;
            result.bot.category = bot.category;
            break;
        }
    }

    /* ---------------------------------------------
     * BROWSER DETECTION (ORDER MATTERS)
     * ------------------------------------------- */

    const browserRules = [
        { name: "Edge", regex: /edg\/([\d.]+)/i },
        { name: "Opera", regex: /opr\/([\d.]+)/i },
        { name: "Chrome", regex: /chrome\/([\d.]+)/i },
        { name: "Firefox", regex: /firefox\/([\d.]+)/i },
        { name: "Safari", regex: /version\/([\d.]+).*safari/i }
    ];

    for (const rule of browserRules) {
        const match = ua.match(rule.regex);
        if (match) {
            result.browser.name = rule.name;
            result.browser.version = match[1];
            result.browser.major = match[1].split(".")[0];
            break;
        }
    }

    /* ---------------------------------------------
     * ENGINE DETECTION (FIXED)
     * ------------------------------------------- */

    if (/chrome|chromium|crios/i.test(ua)) {
        result.engine.name = "Blink";
    } else if (/gecko/i.test(ua) && !/like gecko/i.test(ua)) {
        result.engine.name = "Gecko";
    } else if (/applewebkit/i.test(ua)) {
        result.engine.name = "WebKit";
    }

    /* ---------------------------------------------
     * OS DETECTION (FIXED)
     * ------------------------------------------- */

    const osRules = [
        { name: "Windows", regex: /windows nt ([\d.]+)/i },
        { name: "macOS", regex: /mac os x ([\d_]+)/i },
        { name: "Android", regex: /android ([\d.]+)/i },
        { name: "iOS", regex: /iphone os ([\d_]+)/i },
        { name: "Linux", regex: /linux/i }
    ];

    for (const rule of osRules) {
        const match = ua.match(rule.regex);
        if (match) {
            result.os.name = rule.name;
            result.os.version = match[1]?.replace(/_/g, ".") || null;
            break;
        }
    }

    /* ---------------------------------------------
     * DEVICE TYPE
     * ------------------------------------------- */

    if (/mobile/i.test(ua)) result.device.type = "mobile";
    else if (/tablet/i.test(ua)) result.device.type = "tablet";

    /* ---------------------------------------------
     * CPU ARCH
     * ------------------------------------------- */

    if (/arm|aarch64/i.test(ua)) result.cpu.architecture = "arm";
    else if (/x64|win64|amd64/i.test(ua)) result.cpu.architecture = "amd64";
    else if (/x86/i.test(ua)) result.cpu.architecture = "x86";

    return result;
}

async function isBot(ua) {
  return (await parseUA(ua)).bot.isBot;
}

async function isCrawler(ua) {
  return (await parseUA(ua)).bot.isCrawler;
}

async function isAI(ua) {
  return (await parseUA(ua)).bot.isAI;
}

export {
  parseUA,
  isBot,
  isCrawler,
  isAI
};
