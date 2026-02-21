/*
 * Copyright 2026 Kris Powers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */

'use strict';

import { log } from "./logger.js";
import { cache } from '../utils/cache.js';
import { parseUA } from '../utils/ua-parser.js';
import crypto from "crypto";

class Throttle {
  constructor(options = {}) {
    if (!options.limit || !options.window_ms) {
      throw new Error("limit and window_ms are required");
    }

    this.baseConfig = {
      limit: options.limit,
      windowMs: options.window_ms,
      burstLimit: options.burst_limit || 20,
      burstWindowMs: options.burst_window_ms || 1000,
      banThreshold: options.ban_threshold || 5,
      banMs: options.ban_ms || 24 * 60 * 60 * 1000,
      violationDecayMs: options.violation_decay_ms || 60 * 60 * 1000,
      uaRotationThreshold: options.ua_rotation_threshold || 5,
    };

    this.policies =
      typeof options.policies === "function" ? options.policies : null;

    this.namespace = options.namespace || "throttle";

    // Normalize retention config
    const retention = {
      enabled: Boolean(options.retention?.enabled),
      maxEntries: Number(options.retention?.maxEntries) || 0
    };

    // Inject retention policy into logger
    log._setRetention(retention);
  }

  _now() {
    return Date.now();
  }

  _hashUA(ua) {
    return crypto.createHash("sha256").update(ua).digest("hex");
  }

  _key(ip, uaHash) {
    return `${this.namespace}:${ip}:${uaHash}`;
  }

  _ipKey(ip) {
    return `${this.namespace}:ip:${ip}`;
  }

  _banKey(ip) {
    return `${this.namespace}:ban:${ip}`;
  }

  _weightFromUA(ua) {
    const l = ua.toLowerCase();
    if (
      l.includes("bot") ||
      l.includes("crawler") ||
      l.includes("spider") ||
      l.includes("scrapy") ||
      l.includes("curl") ||
      l.includes("wget")
    )
      return 5;
    if (
      l.includes("openai") ||
      l.includes("gpt") ||
      l.includes("anthropic") ||
      l.includes("claude") ||
      l.includes("ai")
    )
      return 10;
    return 1;
  }

  _resolveConfig(context, ip, ua) {
    if (!this.policies) return this.baseConfig;
    const override = this.policies({ ip, ua, context }) || {};
    return { ...this.baseConfig, ...override };
  }

  /**
   * Check if request should be throttled.
   *
   * @param {string} ip - Client IP address
   * @param {string} ua - User-Agent string
   * @param {Object} [context={}] - Full req object. bypassThrottle is read from context.triva.bypassThrottle.
   * @returns {Promise<Object>} Throttle result with restricted status and reason
   */
  async check(ip, ua, context = {}) {
    if (!ip || !ua) return { restricted: true, reason: "invalid_identity", uaData: null };

    // Check for bypass flag (set by redirect middleware)
    if (context.triva?.bypassThrottle === true) {
      return {
        restricted: false,
        reason: null,
        uaData: null,
        bypassed: true
      };
    }

    const now = this._now();
    const uaHash = this._hashUA(ua);
    const config = this._resolveConfig(context, ip, ua);

    // Parse user agent for detailed information
    const uaData = await parseUA(ua);

    const key = this._key(ip, uaHash);
    const ipKey = this._ipKey(ip);
    const banKey = this._banKey(ip);

    const ban = await cache.get(banKey);
    if (ban && ban.banned_until > now) {
      return { restricted: true, reason: "auto_ban", uaData };
    }

    let ipRecord = (await cache.get(ipKey)) || { uas: [] };

    if (!ipRecord.uas.includes(uaHash)) {
      ipRecord.uas.push(uaHash);
      if (ipRecord.uas.length > config.uaRotationThreshold) {
        return { restricted: true, reason: "ua_rotation", uaData };
      }
      await cache.set(ipKey, ipRecord);
    }

    let record = (await cache.get(key)) || {
      hits: [],
      burst: [],
      violations: 0,
      last_violation: 0,
    };

    if (record.violations > 0 && now - record.last_violation > config.violationDecayMs) {
      record.violations--;
      record.last_violation = now;
    }

    // Use UA parsed data to determine weight
    let baseWeight = 1;
    if (uaData.bot.isBot) {
      baseWeight = uaData.bot.isAI ? 10 : 5;
    }

    const weight =
      typeof config.weight_multiplier === "number"
        ? Math.ceil(baseWeight * config.weight_multiplier)
        : baseWeight;

    record.hits = record.hits.filter((ts) => ts >= now - config.windowMs);
    record.burst = record.burst.filter((ts) => ts >= now - config.burstWindowMs);

    if (record.burst.length + weight > config.burstLimit) {
      await this._violation(record, key, banKey, config);
      return { restricted: true, reason: "burst_limit", uaData };
    }

    if (record.hits.length + weight > config.limit) {
      await this._violation(record, key, banKey, config);
      return { restricted: true, reason: "sliding_window", uaData };
    }

    for (let i = 0; i < weight; i++) {
      record.hits.push(now);
      record.burst.push(now);
    }

    await cache.set(key, record);
    return { restricted: false, reason: "ok", uaData };
  }

  async _violation(record, key, banKey, config) {
    record.violations++;
    record.last_violation = this._now();
    if (record.violations >= config.banThreshold) {
      await cache.set(banKey, { banned_until: this._now() + config.banMs });
    }
    await cache.set(key, record);
  }
}

export { Throttle };
