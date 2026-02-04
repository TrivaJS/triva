/**
 * CLI Tests (Zero Dependencies)
 * Tests CLI command parsing and output formatting
 */

import assert from 'assert';
import { Command } from '../lib/command.js';

// Test suite
const tests = {
  'Command - formats table output'() {
    const data = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' }
    ];

    const table = Command.toTable(data);
    
    assert.ok(table.includes('Alice'));
    assert.ok(table.includes('Bob'));
    assert.ok(table.includes('name'));
  },

  'Command - formats CSV output'() {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];

    const csv = Command.toCSV(data);
    
    assert.ok(csv.includes('name,age'));
    assert.ok(csv.includes('Alice,30'));
    assert.ok(csv.includes('Bob,25'));
  },

  'Command - parses time range (hours)'() {
    const time = Command.parseTimeRange('24h');
    const expected = Date.now() - (24 * 3600000);
    
    assert.ok(Math.abs(time - expected) < 1000); // Within 1 second
  },

  'Command - parses time range (days)'() {
    const time = Command.parseTimeRange('7d');
    const expected = Date.now() - (7 * 86400000);
    
    assert.ok(Math.abs(time - expected) < 1000);
  },

  'Command - parses time range (weeks)'() {
    const time = Command.parseTimeRange('2w');
    const expected = Date.now() - (2 * 604800000);
    
    assert.ok(Math.abs(time - expected) < 1000);
  },

  'Command - parses time range (invalid)'() {
    const time = Command.parseTimeRange('invalid');
    assert.strictEqual(time, null);
  },

  'Command - formats JSON output'() {
    const data = [{ test: 'value' }];
    const output = Command.formatOutput(data, 'json');
    
    assert.strictEqual(output, JSON.stringify(data, null, 2));
  },

  'Command - handles empty data in table'() {
    const table = Command.toTable([]);
    assert.strictEqual(table, 'No data');
  },

  'Command - handles empty data in CSV'() {
    const csv = Command.toCSV([]);
    assert.strictEqual(csv, '');
  },

  'Command - escapes CSV values with commas'() {
    const data = [{ name: 'Last, First', age: 30 }];
    const csv = Command.toCSV(data);
    
    assert.ok(csv.includes('"Last, First"'));
  }
};

// Test runner
function runTests() {
  console.log('🧪 Running CLI Tests\n');
  
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
