#!/usr/bin/env node

/**
 * Build and Release Script
 * Prepares the package for npm publishing
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('📦 Triva Build & Release\n');

async function main() {
  const args = process.argv.slice(2);
  const version = args[0]; // patch, minor, major

  if (!version || !['patch', 'minor', 'major'].includes(version)) {
    console.error('❌ Invalid version type');
    console.log('Usage: npm run release [patch|minor|major]');
    process.exit(1);
  }

  console.log(`🔨 Building Triva for ${version} release...\n`);

  // 1. Run tests
  console.log('1️⃣  Running tests...');
  try {
    execSync('npm test', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Tests passed\n');
  } catch (err) {
    console.error('❌ Tests failed');
    process.exit(1);
  }

  // 2. Lint code
  console.log('2️⃣  Linting code...');
  try {
    execSync('npm run lint --if-present', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Linting passed\n');
  } catch (err) {
    console.log('⚠️  No lint script found, skipping\n');
  }

  // 3. Generate documentation
  console.log('3️⃣  Generating documentation...');
  try {
    execSync('node scripts/generate-docs.js', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Documentation generated\n');
  } catch (err) {
    console.error('❌ Documentation generation failed');
    process.exit(1);
  }

  // 4. Update version
  console.log(`4️⃣  Bumping ${version} version...`);
  try {
    execSync(`npm version ${version} --no-git-tag-version`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('✅ Version updated\n');
  } catch (err) {
    console.error('❌ Version bump failed');
    process.exit(1);
  }

  // 5. Read new version
  const packageJson = JSON.parse(
    await readFile(join(rootDir, 'package.json'), 'utf-8')
  );
  const newVersion = packageJson.version;

  // 6. Update changelog
  console.log('5️⃣  Updating CHANGELOG...');
  await updateChangelog(newVersion);
  console.log('✅ CHANGELOG updated\n');

  // 7. Git operations
  console.log('6️⃣  Creating git commit and tag...');
  try {
    execSync('git add .', { cwd: rootDir });
    execSync(`git commit -m "Release v${newVersion}"`, { cwd: rootDir });
    execSync(`git tag v${newVersion}`, { cwd: rootDir });
    console.log('✅ Git commit and tag created\n');
  } catch (err) {
    console.log('⚠️  Git operations skipped (not a git repo or no changes)\n');
  }

  console.log('🎉 Build complete!\n');
  console.log(`📋 Release checklist for v${newVersion}:`);
  console.log('   1. Review CHANGELOG.md');
  console.log('   2. Push commits: git push');
  console.log('   3. Push tags: git push --tags');
  console.log('   4. Publish to npm: npm publish');
  console.log('   5. Create GitHub release\n');
}

async function updateChangelog(version) {
  const changelogPath = join(rootDir, 'CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];

  let changelog;
  try {
    changelog = await readFile(changelogPath, 'utf-8');
  } catch (err) {
    // Create new changelog if doesn't exist
    changelog = '# Changelog\n\nAll notable changes to Triva will be documented in this file.\n\n';
  }

  const entry = `## [${version}] - ${date}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;

  // Insert after header
  const lines = changelog.split('\n');
  const headerEnd = lines.findIndex((line, i) =>
    i > 0 && line.startsWith('## ')
  );

  if (headerEnd > 0) {
    lines.splice(headerEnd, 0, entry);
  } else {
    lines.push(entry);
  }

  await writeFile(changelogPath, lines.join('\n'));
}

main().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
