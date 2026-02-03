#!/usr/bin/env node

/**
 * Migration Helper
 * Helps users migrate between Triva versions
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🔄 Triva Migration Helper\n');

const migrations = {
  '0.x-to-1.x': {
    name: 'Migrate from 0.x to 1.0',
    description: 'Update your code to use centralized configuration',
    steps: [
      'Move all configuration to build() call',
      'Replace scattered imports with centralized config',
      'Update database adapter initialization',
      'Migrate middleware to new format'
    ],
    breaking: [
      'Configuration is now centralized in build()',
      'Database adapters use new connection format',
      'Middleware API has changed',
      'Some exports have been renamed'
    ],
    codeExamples: {
      before: `// Old way (0.x)
import triva from 'triva';
import { cache } from 'triva/cache';

const app = triva();
cache.configure({ type: 'redis', host: 'localhost' });

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.listen(3000);`,
      after: `// New way (1.x)
import { build, get, listen, cache } from 'triva';

await build({
  cache: {
    type: 'redis',
    database: { host: 'localhost', port: 6379 }
  }
});

get('/', (req, res) => {
  res.json({ ok: true });
});

listen(3000);`
    }
  }
};

async function main() {
  const args = process.argv.slice(2);
  const migrationKey = args[0];

  if (!migrationKey) {
    console.log('Available migrations:\n');
    Object.entries(migrations).forEach(([key, migration]) => {
      console.log(`  ${key}: ${migration.name}`);
    });
    console.log('\nUsage: npm run migrate [migration-key]');
    console.log('Example: npm run migrate 0.x-to-1.x\n');
    return;
  }

  const migration = migrations[migrationKey];

  if (!migration) {
    console.error(`❌ Migration '${migrationKey}' not found\n`);
    return;
  }

  console.log(`📖 ${migration.name}\n`);
  console.log(`${migration.description}\n`);

  // Show breaking changes
  if (migration.breaking && migration.breaking.length > 0) {
    console.log('⚠️  Breaking Changes:\n');
    migration.breaking.forEach((change, i) => {
      console.log(`   ${i + 1}. ${change}`);
    });
    console.log('');
  }

  // Show migration steps
  console.log('📋 Migration Steps:\n');
  migration.steps.forEach((step, i) => {
    console.log(`   ${i + 1}. ${step}`);
  });
  console.log('');

  // Show code examples
  if (migration.codeExamples) {
    console.log('💡 Code Examples:\n');
    console.log('Before:');
    console.log('```javascript');
    console.log(migration.codeExamples.before);
    console.log('```\n');
    console.log('After:');
    console.log('```javascript');
    console.log(migration.codeExamples.after);
    console.log('```\n');
  }

  console.log('✅ Migration guide complete!\n');
  console.log('📚 For detailed documentation, see: docs/MIGRATION.md\n');
}

main().catch((err) => {
  console.error('❌ Migration helper error:', err);
  process.exit(1);
});
