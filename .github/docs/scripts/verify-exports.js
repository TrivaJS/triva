#!/usr/bin/env node
// verify-exports.js - Verify all Triva exports are working

console.log('🔍 Verifying Triva Exports\n');

let errors = 0;

// Test main module exports
try {
  console.log('Testing main module imports...');
  
  const triva = await import('triva');
  
  const expectedExports = [
    'build',
    'middleware',
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'use',
    'listen',
    'setErrorHandler',
    'setNotFoundHandler',
    'TrivaServer',
    'log',
    'cache',
    'configCache'
  ];
  
  for (const exp of expectedExports) {
    if (exp in triva) {
      console.log(`  ✅ ${exp}`);
    } else {
      console.log(`  ❌ ${exp} - MISSING`);
      errors++;
    }
  }
  
  console.log('');
} catch (err) {
  console.error('❌ Failed to import main module:', err.message);
  errors++;
}

// Test cache submodule
try {
  console.log('Testing cache submodule...');
  
  const cacheModule = await import('triva/cache');
  
  const expectedCacheExports = ['cache', 'configCache', 'CacheManager'];
  
  for (const exp of expectedCacheExports) {
    if (exp in cacheModule) {
      console.log(`  ✅ ${exp}`);
    } else {
      console.log(`  ❌ ${exp} - MISSING`);
      errors++;
    }
  }
  
  console.log('');
} catch (err) {
  console.error('❌ Failed to import cache submodule:', err.message);
  errors++;
}

// Test log submodule
try {
  console.log('Testing log submodule...');
  
  const logModule = await import('triva/log');
  
  const expectedLogExports = ['log', 'LogEntry'];
  
  for (const exp of expectedLogExports) {
    if (exp in logModule) {
      console.log(`  ✅ ${exp}`);
    } else {
      console.log(`  ❌ ${exp} - MISSING`);
      errors++;
    }
  }
  
  console.log('');
} catch (err) {
  console.error('❌ Failed to import log submodule:', err.message);
  errors++;
}

// Test middleware submodule
try {
  console.log('Testing middleware submodule...');
  
  const middlewareModule = await import('triva/middleware');
  
  if ('middleware' in middlewareModule) {
    console.log('  ✅ middleware');
  } else {
    console.log('  ❌ middleware - MISSING');
    errors++;
  }
  
  console.log('');
} catch (err) {
  console.error('❌ Failed to import middleware submodule:', err.message);
  errors++;
}

// Test basic functionality
try {
  console.log('Testing basic functionality...');
  
  const { build, get, cache, log, configCache } = await import('triva');
  
  // Test build
  const server = build({ env: 'test' });
  console.log('  ✅ build() works');
  
  // Test route registration
  get('/verify', (req, res) => {
    res.send('test');
  });
  console.log('  ✅ get() works');
  
  // Test configCache
  configCache({
    cache_data: true,
    cache_type: 'local',
    cache_limit: 100
  });
  console.log('  ✅ configCache() works');
  
  // Test cache operations
  await cache.set('test-key', 'test-value');
  const value = await cache.get('test-key');
  if (value === 'test-value') {
    console.log('  ✅ cache.set/get works');
  } else {
    console.log('  ❌ cache.set/get failed');
    errors++;
  }
  
  // Test log operations
  const stats = await log.getStats();
  if (stats && typeof stats === 'object') {
    console.log('  ✅ log.getStats() works');
  } else {
    console.log('  ❌ log.getStats() failed');
    errors++;
  }
  
  console.log('');
} catch (err) {
  console.error('❌ Basic functionality test failed:', err.message);
  console.error(err.stack);
  errors++;
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (errors === 0) {
  console.log('✅ All exports verified successfully!');
  process.exit(0);
} else {
  console.log(`❌ Found ${errors} error(s)`);
  process.exit(1);
}
