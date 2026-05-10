/**
 * Triva RPS Benchmark — Requests Per Second
 */

import http from 'http';
import async_hooks from 'node:async_hooks';
import { performance } from 'node:perf_hooks';
import { build } from '../lib/index.js';

const PORT        = 9990;
const ROUNDS      = 10;
const WINDOW_SECS = 10;
const CONCURRENCY = 50;

// ─── First-request deep trace (benchmark-only) ───────────────────────────────

let FIRST_TRACE_DONE = false;
const TRACE_EVENTS = [];
const ASYNC_EVENTS = [];

function logEvent(label, extra = {}) {
  TRACE_EVENTS.push({
    ts: performance.now(),
    label,
    ...extra
  });
}

// Async hook (passive observation only)
const hook = async_hooks.createHook({
  init(asyncId, type) {
    if (!FIRST_TRACE_DONE) {
      ASYNC_EVENTS.push({
        ts: performance.now(),
        type
      });
    }
  }
});
hook.enable();

// ─── Spin up server ──────────────────────────────────────────────────────────

const instanceBuild = new build({ env: 'production' });

instanceBuild.get('/rps', (req, res) => {
  res.send('Hello World!');
});

const server = instanceBuild.listen(PORT);
await new Promise(r => setTimeout(r, 150));

// ─── HTTP helper with deep first-request tracing ─────────────────────────────

function fire() {
  return new Promise((resolve) => {
    const isFirst = !FIRST_TRACE_DONE;

    if (isFirst) logEvent('request:start');

    const req = http.request(
      { hostname: 'localhost', port: PORT, path: '/rps', method: 'GET' },
      (res) => {
        if (isFirst) logEvent('response:headers');

        res.on('data', () => {
          if (isFirst) logEvent('response:data');
        });

        res.on('end', () => {
          if (isFirst) {
            logEvent('response:end');
            FIRST_TRACE_DONE = true;
          }
          resolve(true);
        });
      }
    );

    req.on('socket', (socket) => {
      if (!isFirst) return;

      logEvent('socket:assigned');

      socket.on('lookup', () => logEvent('dns:lookup'));
      socket.on('connect', () => logEvent('tcp:connect'));
      socket.on('ready', () => logEvent('socket:ready'));
    });

    if (isFirst) logEvent('request:write');
    req.end();

    req.on('error', () => resolve(false));
  });
}

// ─── One-second measurement window ───────────────────────────────────────────

async function measureOneSecond() {
  const deadline  = Date.now() + 1000;
  let completed   = 0;
  const inflight  = new Set();

  function launchOne() {
    if (Date.now() >= deadline) return;
    const p = fire().then((ok) => {
      inflight.delete(p);
      if (ok) completed++;
      if (Date.now() < deadline) launchOne();
    });
    inflight.add(p);
  }

  for (let i = 0; i < CONCURRENCY; i++) launchOne();

  await new Promise(r => setTimeout(r, 1000));
  if (inflight.size > 0) await Promise.allSettled([...inflight]);

  return completed;
}

// ─── Round runner ────────────────────────────────────────────────────────────

async function runRound(roundNum) {
  const perSecond = [];
  process.stdout.write(`  Round ${String(roundNum).padStart(2, ' ')}: `);

  for (let s = 0; s < WINDOW_SECS; s++) {
    const count = await measureOneSecond();
    perSecond.push(count);
    process.stdout.write('.');
  }

  const avg = Math.round(perSecond.reduce((a, b) => a + b, 0) / perSecond.length);
  const best = Math.max(...perSecond);
  console.log(`  avg ${avg.toLocaleString()} req/s  (best second: ${best.toLocaleString()})`);

  return { perSecond, avg, best };
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('');
console.log('⚡ Triva RPS Benchmark');
console.log('━'.repeat(60));

const roundResults = [];

for (let r = 1; r <= ROUNDS; r++) {
  roundResults.push(await runRound(r));
  await new Promise(res => setTimeout(res, 200));
}

// ─── Final Summary + Trace ───────────────────────────────────────────────────

console.log('');
console.log('━'.repeat(60));
console.log('🔬 First Request Deep Timeline');
console.log('━'.repeat(60));

const base = TRACE_EVENTS[0]?.ts ?? 0;

for (const e of TRACE_EVENTS) {
  console.log(
    `${(e.ts - base).toFixed(3).padStart(8)} ms  ${e.label}`
  );
}

console.log('');
console.log('Async activity observed:');
const asyncCount = {};
for (const a of ASYNC_EVENTS) {
  asyncCount[a.type] = (asyncCount[a.type] || 0) + 1;
}

for (const [type, count] of Object.entries(asyncCount)) {
  console.log(`  • ${type.padEnd(14)} ${count}`);
}

console.log('');
console.log('━'.repeat(60));

server.close();
process.exit(0);
