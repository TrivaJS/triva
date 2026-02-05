#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------
 * SOURCE (LOCAL)
 * ------------------------------------------------- */
const SOURCE_FILE = path.resolve(__dirname, '..', '..', '..', 'snippets', 'triva.json');

/* -------------------------------------------------
 * IDE DETECTION (STRICT + BEST-EFFORT)
 * ------------------------------------------------- */
function detectIDEs() {
  const detected = new Set();
  const env = process.env;
  const home = os.homedir();

  // ---- HIGH CONFIDENCE (ENV) ----
  if (env.VSCODE_CWD || env.TERM_PROGRAM === 'vscode') {
    detected.add('vsc');
  }

  if (env.TERM_PROGRAM === 'vscode-insiders') {
    detected.add('vsci');
  }

  if (env.ATOM_HOME) {
    detected.add('atom');
  }

  // ---- LOWER CONFIDENCE (FILESYSTEM) ----
  const fsChecks = {
    vsc: [
      path.join(home, 'AppData', 'Roaming', 'Code'),
      path.join(home, '.config', 'Code'),
      path.join(home, 'Library', 'Application Support', 'Code')
    ],
    vsci: [
      path.join(home, 'AppData', 'Roaming', 'Code - Insiders'),
      path.join(home, '.config', 'Code - Insiders'),
      path.join(home, 'Library', 'Application Support', 'Code - Insiders')
    ],
    atom: [
      path.join(home, '.atom')
    ]
  };

  for (const [ide, paths] of Object.entries(fsChecks)) {
    if (paths.some(p => fs.existsSync(p))) {
      detected.add(ide);
    }
  }

  return Array.from(detected);
}

/* -------------------------------------------------
 * FILE HELPERS
 * ------------------------------------------------- */
function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function escapeAtom(body) {
  return body.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/* -------------------------------------------------
 * VS CODE TARGETS
 * ------------------------------------------------- */
function getVSCodeTargets() {
  const home = os.homedir();

  const roots =
    process.platform === 'win32'
      ? [
          path.join(home, 'AppData', 'Roaming', 'Code', 'User', 'snippets'),
          path.join(home, 'AppData', 'Roaming', 'Code - Insiders', 'User', 'snippets')
        ]
      : process.platform === 'darwin'
      ? [
          path.join(home, 'Library', 'Application Support', 'Code', 'User', 'snippets'),
          path.join(home, 'Library', 'Application Support', 'Code - Insiders', 'User', 'snippets')
        ]
      : [
          path.join(home, '.config', 'Code', 'User', 'snippets'),
          path.join(home, '.config', 'Code - Insiders', 'User', 'snippets')
        ];

  return roots.flatMap(r => [
    path.join(r, 'javascript.json'),
    path.join(r, 'typescript.json')
  ]);
}

/* -------------------------------------------------
 * VS CODE INSTALL / UNINSTALL
 * ------------------------------------------------- */
function installVSCode(source) {
  for (const target of getVSCodeTargets()) {
    const existing = readJSON(target);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const [key, snippet] of Object.entries(source)) {
      if (!existing[key]) added++;
      else if (JSON.stringify(existing[key]) !== JSON.stringify(snippet)) updated++;
      else skipped++;

      existing[key] = snippet;
    }

    writeJSON(target, existing);

    console.log(`✔ VS Code → ${target}`);
    console.log(`  ➕ Added: ${added}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ⏭ Skipped: ${skipped}`);
  }
}

function uninstallVSCode(source) {
  for (const target of getVSCodeTargets()) {
    if (!fs.existsSync(target)) continue;

    const existing = readJSON(target);
    let removed = 0;

    for (const key of Object.keys(source)) {
      if (key in existing) {
        delete existing[key];
        removed++;
      }
    }

    if (removed) {
      writeJSON(target, existing);
      console.log(`🧹 VS Code cleaned → ${target} (${removed} removed)`);
    }
  }
}

/* -------------------------------------------------
 * ATOM INSTALL / UNINSTALL
 * ------------------------------------------------- */
const ATOM_FILE = path.join(os.homedir(), '.atom', 'snippets.cson');
const ATOM_SCOPES = ['.source.js', '.source.ts'];

function installAtom(source) {
  fs.mkdirSync(path.dirname(ATOM_FILE), { recursive: true });

  let content = fs.existsSync(ATOM_FILE)
    ? fs.readFileSync(ATOM_FILE, 'utf8')
    : '';

  let added = 0;
  let out = '';

  for (const scope of ATOM_SCOPES) {
    if (!content.includes(`${scope}:`)) {
      out += `\n${scope}:\n`;
    }

    for (const [name, s] of Object.entries(source)) {
      if (new RegExp(`['"]${name}['"]:\\s*$`, 'm').test(content)) continue;

      const prefix = Array.isArray(s.prefix) ? s.prefix[0] : s.prefix;
      const body = Array.isArray(s.body) ? s.body.join('\n') : s.body;

      out +=
`  '${name}':
    'prefix': '${prefix}'
    'body': '${escapeAtom(body)}'
`;
      added++;
    }
  }

  if (added) {
    fs.appendFileSync(ATOM_FILE, out);
    console.log(`✔ Atom → ${ATOM_FILE} (${added} added)`);
  }
}

function uninstallAtom(source) {
  if (!fs.existsSync(ATOM_FILE)) return;

  let content = fs.readFileSync(ATOM_FILE, 'utf8');
  let removed = 0;

  for (const key of Object.keys(source)) {
    const regex = new RegExp(`\\s*['"]${key}['"]:\\n(?:\\s+.*\\n)+`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, '');
      removed++;
    }
  }

  if (removed) {
    fs.writeFileSync(ATOM_FILE, content);
    console.log(`🧹 Atom cleaned → ${ATOM_FILE} (${removed} removed)`);
  }
}

/* -------------------------------------------------
 * RUN
 * ------------------------------------------------- */
const isUninstall = process.env.npm_lifecycle_event === 'preuninstall';

(async () => {
  console.log('⚡ Triva Shortcuts — snippet sync starting');

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Snippets file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const source = readJSON(SOURCE_FILE);
  if (!Object.keys(source).length) {
    console.warn('⚠ No snippets found — aborting');
    return;
  }

  const detected = detectIDEs();
  const fallbackAll = detected.length === 0;

  console.log(
    fallbackAll
      ? '⚠ No IDE confidently detected — FALLBACK: installing to ALL supported IDEs'
      : `✔ Detected IDE(s): ${detected.join(', ')}`
  );

  if (isUninstall) {
    console.log('🧹 Uninstall mode');

    if (fallbackAll || detected.includes('vsc') || detected.includes('vsci')) {
      uninstallVSCode(source);
    }

    if (fallbackAll || detected.includes('atom')) {
      uninstallAtom(source);
    }
  } else {
    console.log('📦 Install mode');

    if (fallbackAll || detected.includes('vsc') || detected.includes('vsci')) {
      installVSCode(source);
    }

    if (fallbackAll || detected.includes('atom')) {
      installAtom(source);
    }
  }

  console.log('✔ Triva Shortcuts — sync complete');
})().catch(err => {
  console.error('❌ Snippet sync failed');
  console.error(err);
  process.exit(1);
});
