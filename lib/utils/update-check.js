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

import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Determine a user-specific directory for storing update check cache data.
 * Prefer a cache directory under the user's home, falling back to os.tmpdir()
 * only if no home directory or cache location can be determined.
 *
 * @returns {string} Absolute path to the cache directory
 */
function getCacheDir() {
  // Respect XDG cache directory if available
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  if (xdgCacheHome && typeof xdgCacheHome === 'string' && xdgCacheHome.trim() !== '') {
    return path.join(xdgCacheHome, 'triva-update-cache');
  }

  // Fallback to a .cache directory under the user's home
  const homeDir = os.homedir && os.homedir();
  if (homeDir && typeof homeDir === 'string' && homeDir.trim() !== '') {
    return path.join(homeDir, '.cache', 'triva-update-cache');
  }

  // As a last resort, fall back to the OS temp directory, but still use a
  // namespaced subdirectory to reduce interference from other processes.
  return path.join(os.tmpdir(), '.triva-update-cache');
}

/**
 * Configuration for update checking behavior
 */
const CONFIG = {
  // How often to check for updates (24 hours)
  CHECK_INTERVAL: 24 * 60 * 60 * 1000,

  // Request timeout
  TIMEOUT: 3000,

  // Cache file location
  CCACHE_DIR: getCacheDir(),
  CACHE_FILE: 'last-check.json',

  // npm registry URL
  REGISTRY_URL: 'https://registry.npmjs.org/triva/latest',

  // Only check in these environments
  ENABLED_ENVS: ['development', 'test'],

  // Disable in CI environments
  CI_INDICATORS: ['CI', 'CONTINUOUS_INTEGRATION', 'TRAVIS', 'CIRCLECI', 'JENKINS', 'GITHUB_ACTIONS']
};

/**
 * Determines if we're running in a CI environment
 *
 * @returns {boolean} True if in CI environment
 */
function isCI() {
  return CONFIG.CI_INDICATORS.some(indicator => process.env[indicator]);
}

/**
 * Determines if update checking should run
 *
 * @returns {boolean} True if checks should run
 */
function shouldCheck() {
  // Never check in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Never check in CI
  if (isCI()) {
    return false;
  }

  // Check if env is explicitly disabled
  if (process.env.TRIVA_DISABLE_UPDATE_CHECK === 'true') {
    return false;
  }

  return true;
}

/**
 * Reads the update check cache
 *
 * @returns {Object|null} Cached data or null
 */
function readCache() {
  try {
    const cachePath = path.join(CONFIG.CACHE_DIR, CONFIG.CACHE_FILE);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const data = fs.readFileSync(cachePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

/**
 * Writes update check cache
 *
 * @param {Object} data - Data to cache
 */
function writeCache(data) {
  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CONFIG.CACHE_DIR)) {
      fs.mkdirSync(CONFIG.CACHE_DIR, { recursive: true });
    }

    const cachePath = path.join(CONFIG.CACHE_DIR, CONFIG.CACHE_FILE);
    fs.writeFileSync(cachePath, JSON.stringify(data), 'utf8');
  } catch (err) {
    // Silently fail - caching is not critical
  }
}

/**
 * Checks if we should perform a new check based on cache
 *
 * @returns {boolean} True if check should be performed
 */
function shouldPerformCheck() {
  const cache = readCache();

  if (!cache || !cache.lastCheck) {
    return true;
  }

  const timeSinceLastCheck = Date.now() - cache.lastCheck;
  return timeSinceLastCheck > CONFIG.CHECK_INTERVAL;
}

/**
 * Fetches latest version info from npm registry
 *
 * @async
 * @returns {Promise<Object|null>} Version info or null on failure
 */
function fetchLatestVersion() {
  return new Promise((resolve) => {
    const request = https.get(CONFIG.REGISTRY_URL, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'Triva-Update-Notifier',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            version: parsed.version,
            publishedAt: parsed.time?.modified || new Date().toISOString(),
            homepage: parsed.homepage,
            repository: parsed.repository?.url
          });
        } catch (err) {
          resolve(null);
        }
      });
    });

    request.on('error', () => {
      resolve(null);
    });

    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Compares two semver version strings
 *
 * @param {string} current - Current version (e.g., "1.2.3")
 * @param {string} latest - Latest version (e.g., "1.3.0")
 * @returns {number} -1 if current < latest, 0 if equal, 1 if current > latest
 */
function compareVersions(current, latest) {
  const cleanCurrent = current.replace(/^v/, '');
  const cleanLatest = latest.replace(/^v/, '');

  const currentParts = cleanCurrent.split('.').map(Number);
  const latestParts = cleanLatest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;

    if (curr < lat) return -1;
    if (curr > lat) return 1;
  }

  return 0;
}

/**
 * Determines update urgency based on version difference
 *
 * @param {string} current - Current version
 * @param {string} latest - Latest version
 * @returns {string} 'major', 'minor', 'patch', or 'current'
 */
function getUpdateUrgency(current, latest) {
  const cleanCurrent = current.replace(/^v/, '');
  const cleanLatest = latest.replace(/^v/, '');

  const currentParts = cleanCurrent.split('.').map(Number);
  const latestParts = cleanLatest.split('.').map(Number);

  if (latestParts[0] > currentParts[0]) return 'major';
  if (latestParts[1] > currentParts[1]) return 'minor';
  if (latestParts[2] > currentParts[2]) return 'patch';

  return 'current';
}

/**
 * Formats the update notification message
 *
 * @param {string} currentVersion - Current installed version
 * @param {Object} latestInfo - Latest version info from registry
 * @returns {string} Formatted message
 */
function formatUpdateMessage(currentVersion, latestInfo) {
  const urgency = getUpdateUrgency(currentVersion, latestInfo.version);

  let emoji = '📦';
  let urgencyText = '';

  if (urgency === 'major') {
    emoji = '🚀';
    urgencyText = ' (MAJOR UPDATE)';
  } else if (urgency === 'patch') {
    emoji = '🔧';
    urgencyText = ' (Patch - may include security fixes)';
  }

  const lines = [
    '',
    '┌─────────────────────────────────────────────────────┐',
    `│  ${emoji}  Triva Update Available${urgencyText.padEnd(24)}│`,
    '├─────────────────────────────────────────────────────┤',
    `│  Current: ${currentVersion.padEnd(42)} │`,
    `│  Latest:  ${latestInfo.version.padEnd(42)} │`,
    '├─────────────────────────────────────────────────────┤',
    '│  Update now:                                        │',
    '│    npm install triva@latest                         │',
    '│                                                     │',
    '│  Or add to package.json:                            │',
    '│    "triva": "^' + latestInfo.version + '"' + ' '.repeat(Math.max(0, 28 - latestInfo.version.length)) + '│',
    '├─────────────────────────────────────────────────────┤',
    '│  To disable this notification:                      │',
    '│    export TRIVA_DISABLE_UPDATE_CHECK=true           │',
    '└─────────────────────────────────────────────────────┘',
    ''
  ];

  return lines.join('\n');
}

/**
 * Main update check function
 * Safe, non-blocking, and respectful of user's environment
 *
 * @async
 * @param {string} currentVersion - Current package version
 * @returns {Promise<void>}
 *
 * @example
 * import { checkForUpdates } from './lib/update-check.js';
 *
 * // Fire and forget - doesn't block
 * checkForUpdates('1.0.0');
 *
 * @example
 * // In build() function
 * import packageJson from './package.json' assert { type: 'json' };
 * checkForUpdates(packageJson.version);
 */
async function checkForUpdates(currentVersion) {
  // Early exit checks (synchronous, fast)
  if (!shouldCheck()) {
    return;
  }

  if (!shouldPerformCheck()) {
    return;
  }

  try {
    // Fetch latest version (async, with timeout)
    const latestInfo = await fetchLatestVersion();

    // Update cache regardless of result
    writeCache({
      lastCheck: Date.now(),
      lastVersion: latestInfo?.version || null
    });

    // If fetch failed, silently exit
    if (!latestInfo) {
      return;
    }

    // Compare versions
    const comparison = compareVersions(currentVersion, latestInfo.version);

    // Only notify if update available
    if (comparison === -1) {
      const message = formatUpdateMessage(currentVersion, latestInfo);
      console.log(message);
    }
  } catch (err) {
    // Never break user's application
    // Silently fail - update checks are non-critical
  }
}

/**
 * Synchronous version for immediate checking
 * Only use when you need to block (rare)
 *
 * @param {string} currentVersion - Current package version
 */
function checkForUpdatesSync(currentVersion) {
  checkForUpdates(currentVersion).catch(() => {
    // Silently ignore errors
  });
}

/**
 * Clears the update check cache
 * Useful for testing or forcing a new check
 *
 * @example
 * import { clearCache } from './lib/update-check.js';
 * clearCache();
 */
function clearCache() {
  try {
    const cachePath = path.join(CONFIG.CACHE_DIR, CONFIG.CACHE_FILE);
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch (err) {
    // Silently fail
  }
}

/**
 * Gets the current cache status (for debugging)
 *
 * @returns {Object} Cache status
 *
 * @example
 * import { getCacheStatus } from './lib/update-check.js';
 * console.log(getCacheStatus());
 */
function getCacheStatus() {
  const cache = readCache();

  if (!cache) {
    return {
      exists: false,
      lastCheck: null,
      nextCheck: null
    };
  }

  return {
    exists: true,
    lastCheck: new Date(cache.lastCheck).toISOString(),
    nextCheck: new Date(cache.lastCheck + CONFIG.CHECK_INTERVAL).toISOString(),
    lastVersion: cache.lastVersion
  };
}

export {
  checkForUpdates,
  checkForUpdatesSync,
  clearCache,
  getCacheStatus,
  CONFIG
};
