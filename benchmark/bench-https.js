/*!
 * Triva - HTTPS Benchmark
 * Copyright (c) 2026 Kris Powers
 * License MIT
 */

'use strict';

import { build } from '../lib/index.js';
import https from 'https';
import fs from 'fs';
import { execSync } from 'child_process';

const PORT = 3443;
const REQUESTS = 10000;
const CONCURRENCY = 100;

// Generate test certificates if they don't exist
function ensureCertificates() {
  if (!fs.existsSync('./key.pem') || !fs.existsSync('./cert.pem')) {
    console.log('📝 Generating test certificates...');
    try {
      execSync('npm run generate-certs', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to generate certificates');
      process.exit(1);
    }
  }
}

// Load test certificate to trust the local HTTPS server
const ca = fs.readFileSync('./cert.pem');

async function runBenchmark() {
  console.log('========================================');
  console.log('  Triva HTTPS Server Benchmark');
  console.log('========================================\n');

  ensureCertificates();

  // Build HTTPS server
  const instanceBuild = new build({
    protocol: 'https',
    ssl: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem')
    },
    cache: {
      type: 'memory'
    },
    env: 'production'
  });

  // Define routes
  instanceBuild.get('/', (req, res) => {
    res.json({ message: 'Hello HTTPS' });
  });

  instanceBuild.get('/text', (req, res) => {
    res.send('Plain text response');
  });

  instanceBuild.get('/large', (req, res) => {
    res.json({
      data: new Array(1000).fill({ id: 1, name: 'test', value: 42 })
    });
  });

  // Start server
  const server = await new Promise((resolve) => {
    const srv = instanceBuild.listen(PORT, () => {
      console.log(`✅ HTTPS server started on port ${PORT}\n`);
      resolve(srv);
    });
  });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 100));

  const results = [];

  // Benchmark 1: Simple JSON response
  console.log('🔒 Benchmark 1: Simple HTTPS JSON Response');
  console.log(`   Making ${REQUESTS} requests with ${CONCURRENCY} concurrent connections...\n`);

  const jsonStart = Date.now();
  const jsonRequests = [];

  for (let i = 0; i < REQUESTS; i++) {
    const promise = new Promise((resolve, reject) => {
      const req = https.get({
        hostname: 'localhost',
        port: PORT,
        path: '/',
        rejectUnauthorized: false // Accept self-signed cert
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
    });

    jsonRequests.push(promise);

    // Maintain concurrency
    if (jsonRequests.length >= CONCURRENCY) {
      await Promise.race(jsonRequests.map((p, idx) =>
        p.then(() => idx).catch(() => idx)
      )).then(idx => jsonRequests.splice(idx, 1));
    }
  }

  await Promise.all(jsonRequests);
  const jsonDuration = Date.now() - jsonStart;
  const jsonRps = Math.round(REQUESTS / (jsonDuration / 1000));

  console.log(`   ✅ Completed in ${jsonDuration}ms`);
  console.log(`   📊 ${jsonRps} requests/second\n`);

  results.push({
    name: 'Simple HTTPS JSON',
    requests: REQUESTS,
    duration: jsonDuration,
    rps: jsonRps,
    avgLatency: (jsonDuration / REQUESTS).toFixed(2)
  });

  // Benchmark 2: Text response
  console.log('🔒 Benchmark 2: HTTPS Text Response');
  console.log(`   Making ${REQUESTS} requests with ${CONCURRENCY} concurrent connections...\n`);

  const textStart = Date.now();
  const textRequests = [];

  for (let i = 0; i < REQUESTS; i++) {
    const promise = new Promise((resolve, reject) => {
      const req = https.get({
        hostname: 'localhost',
        port: PORT,
        path: '/text',
        ca
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
    });

    textRequests.push(promise);

    if (textRequests.length >= CONCURRENCY) {
      await Promise.race(textRequests.map((p, idx) =>
        p.then(() => idx).catch(() => idx)
      )).then(idx => textRequests.splice(idx, 1));
    }
  }

  await Promise.all(textRequests);
  const textDuration = Date.now() - textStart;
  const textRps = Math.round(REQUESTS / (textDuration / 1000));

  console.log(`   ✅ Completed in ${textDuration}ms`);
  console.log(`   📊 ${textRps} requests/second\n`);

  results.push({
    name: 'HTTPS Text',
    requests: REQUESTS,
    duration: textDuration,
    rps: textRps,
    avgLatency: (textDuration / REQUESTS).toFixed(2)
  });

  // Benchmark 3: Large JSON response
  console.log('🔒 Benchmark 3: Large HTTPS JSON Response');
  console.log(`   Making ${Math.round(REQUESTS / 10)} requests with ${CONCURRENCY} concurrent connections...\n`);

  const largeRequests = Math.round(REQUESTS / 10);
  const largeStart = Date.now();
  const largeReqs = [];

  for (let i = 0; i < largeRequests; i++) {
    const promise = new Promise((resolve, reject) => {
      const req = https.get({
        hostname: 'localhost',
        port: PORT,
        path: '/large',
        ca: fs.readFileSync('./cert.pem')
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
    });

    largeReqs.push(promise);

    if (largeReqs.length >= CONCURRENCY) {
      await Promise.race(largeReqs.map((p, idx) =>
        p.then(() => idx).catch(() => idx)
      )).then(idx => largeReqs.splice(idx, 1));
    }
  }

  await Promise.all(largeReqs);
  const largeDuration = Date.now() - largeStart;
  const largeRps = Math.round(largeRequests / (largeDuration / 1000));

  console.log(`   ✅ Completed in ${largeDuration}ms`);
  console.log(`   📊 ${largeRps} requests/second\n`);

  results.push({
    name: 'Large HTTPS JSON',
    requests: largeRequests,
    duration: largeDuration,
    rps: largeRps,
    avgLatency: (largeDuration / largeRequests).toFixed(2)
  });

  // Close server
  server.close();

  // Print summary
  console.log('========================================');
  console.log('📈 Benchmark Summary');
  console.log('========================================\n');

  results.forEach(result => {
    console.log(`${result.name}:`);
    console.log(`  Requests: ${result.requests.toLocaleString()}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  RPS: ${result.rps.toLocaleString()}`);
    console.log(`  Avg Latency: ${result.avgLatency}ms\n`);
  });

  console.log('========================================\n');

  process.exit(0);
}

runBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
