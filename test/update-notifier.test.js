/**
 * Update Notifier Test & Demo
 * Demonstrates the update checking system
 */

import {
  checkForUpdates,
  clearCache,
  getCacheStatus,
  CONFIG
} from '../lib/utils/update-check.js';

console.log('🧪 Triva Update Notifier Test\n');

// Test 1: Check cache status
console.log('📋 Test 1: Cache Status');
console.log('─────────────────────────');
const status = getCacheStatus();
console.log('Cache exists:', status.exists);
if (status.exists) {
  console.log('Last check:', status.lastCheck);
  console.log('Next check:', status.nextCheck);
  console.log('Last version seen:', status.lastVersion);
} else {
  console.log('No cache found - this is a first run');
}
console.log('');

// Test 2: Configuration
console.log('⚙️  Test 2: Configuration');
console.log('─────────────────────────');
console.log('Check interval:', CONFIG.CHECK_INTERVAL, 'ms (24 hours)');
console.log('Timeout:', CONFIG.TIMEOUT, 'ms');
console.log('Registry URL:', CONFIG.REGISTRY_URL);
console.log('Cache location:', CONFIG.CACHE_DIR);
console.log('');

// Test 3: Environment checks
console.log('🌍 Test 3: Environment');
console.log('─────────────────────────');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('CI detected:', process.env.CI || 'false');
console.log('Update check disabled:', process.env.TRIVA_DISABLE_UPDATE_CHECK || 'false');
console.log('');

// Test 4: Simulate version check
console.log('🔍 Test 4: Version Check');
console.log('─────────────────────────');
console.log('Checking for updates...');
console.log('(This will show notification if update is available)');
console.log('');

// Test with old version to see notification
await checkForUpdates('0.1.0');

console.log('');
console.log('✅ Test complete!');
console.log('');
console.log('💡 Tips:');
console.log('   - Clear cache: node -e "require(\'./lib/update-check.js\').clearCache()"');
console.log('   - Disable checks: export TRIVA_DISABLE_UPDATE_CHECK=true');
console.log('   - Force check: Clear cache, then run this script again');
console.log('');
