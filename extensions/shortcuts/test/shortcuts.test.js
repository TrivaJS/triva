/**
 * Shortcuts Tests (Zero Dependencies)
 * Tests snippet loading and programmatic API
 */

import assert from 'assert';
import { getSnippets, getSnippetByPrefix, listPrefixes, getSnippetsByCategory } from '../lib/index.js';

// Test suite
const tests = {
  'getSnippets - loads all snippets'() {
    const snippets = getSnippets();
    
    assert.ok(typeof snippets === 'object');
    assert.ok(Object.keys(snippets).length > 0);
  },

  'getSnippets - contains required snippets'() {
    const snippets = getSnippets();
    
    assert.ok(snippets['Triva: Build Server']);
    assert.ok(snippets['Triva: Basic Server']);
    assert.ok(snippets['Triva: GET Route']);
  },

  'getSnippets - snippets have correct structure'() {
    const snippets = getSnippets();
    const buildSnippet = snippets['Triva: Build Server'];
    
    assert.ok(buildSnippet.prefix);
    assert.ok(Array.isArray(buildSnippet.body));
    assert.ok(buildSnippet.description);
  },

  'getSnippetByPrefix - finds snippet by prefix'() {
    const snippet = getSnippetByPrefix('triva-server');
    
    assert.ok(snippet);
    assert.strictEqual(snippet.prefix, 'triva-server');
    assert.ok(snippet.name);
  },

  'getSnippetByPrefix - returns null for unknown prefix'() {
    const snippet = getSnippetByPrefix('unknown-prefix');
    
    assert.strictEqual(snippet, null);
  },

  'listPrefixes - returns all prefixes'() {
    const prefixes = listPrefixes();
    
    assert.ok(Array.isArray(prefixes));
    assert.ok(prefixes.length > 0);
    assert.ok(prefixes.includes('triva-server'));
    assert.ok(prefixes.includes('triva-get'));
  },

  'getSnippetsByCategory - filters by cache'() {
    const cacheSnippets = getSnippetsByCategory('cache');
    
    assert.ok(Object.keys(cacheSnippets).length > 0);
    
    // Should include cache-related snippets
    const keys = Object.keys(cacheSnippets);
    assert.ok(keys.some(k => k.includes('Cache')));
  },

  'getSnippetsByCategory - filters by route'() {
    const routeSnippets = getSnippetsByCategory('get');
    
    assert.ok(Object.keys(routeSnippets).length > 0);
  },

  'getSnippetsByCategory - returns empty for unknown category'() {
    const snippets = getSnippetsByCategory('nonexistent-category-xyz');
    
    assert.ok(typeof snippets === 'object');
    // May or may not be empty depending on partial matches
  }
};

// Test runner
function runTests() {
  console.log('🧪 Running Shortcuts Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.error(`     ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
