/**
 * @trivajs/shortcuts
 * Programmatic access to snippet management (optional)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNIPPETS_FILE = path.resolve(__dirname, '..', '..', '..', 'snippets', 'triva.json');

/**
 * Get all Triva snippets
 * @returns {Object} Snippet definitions
 */
export function getSnippets() {
  if (!fs.existsSync(SNIPPETS_FILE)) {
    return {};
  }
  
  return JSON.parse(fs.readFileSync(SNIPPETS_FILE, 'utf-8'));
}

/**
 * Get snippet by prefix
 * @param {string} prefix - Snippet prefix (e.g., 'triva-server')
 * @returns {Object|null} Snippet definition or null
 */
export function getSnippetByPrefix(prefix) {
  const snippets = getSnippets();
  
  for (const [name, snippet] of Object.entries(snippets)) {
    if (snippet.prefix === prefix) {
      return { name, ...snippet };
    }
  }
  
  return null;
}

/**
 * List all snippet prefixes
 * @returns {string[]} Array of prefixes
 */
export function listPrefixes() {
  const snippets = getSnippets();
  return Object.values(snippets).map(s => s.prefix);
}

/**
 * Get snippets by category
 * @param {string} category - Category name (e.g., 'cache', 'route')
 * @returns {Object} Filtered snippets
 */
export function getSnippetsByCategory(category) {
  const snippets = getSnippets();
  const filtered = {};
  
  for (const [name, snippet] of Object.entries(snippets)) {
    if (snippet.prefix.includes(category)) {
      filtered[name] = snippet;
    }
  }
  
  return filtered;
}

export default {
  getSnippets,
  getSnippetByPrefix,
  listPrefixes,
  getSnippetsByCategory
};
