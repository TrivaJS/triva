<p align="center">
  <img src="https://assets.trivajs.com/header.jpg" alt="Triva header">
</p>

# Triva

Triva is a class-based Node.js HTTP and HTTPS framework built around a small application surface: create an app with `new build(...)`, register routes on that instance, and start the server with `app.listen(...)`.

## Install

```bash
npm install triva
```

## Quick Start

```javascript
import { build } from 'triva';

const app = new build({ env: 'development' });

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
});

app.post('/api/users', async (req, res) => {
  const body = await req.json();
  res.status(201).json({ id: Date.now(), ...body });
});

app.listen(3000);
```

## What Triva Actually Gives You

- Class-based routing with `app.get()`, `app.post()`, `app.put()`, `app.del()`, `app.patch()`, `app.all()`, and `app.route()`
- Explicit request parsing through `await req.json()` and `await req.text()`
- Response helpers such as `res.status()`, `res.json()`, `res.send()`, `res.html()`, `res.redirect()`, and `res.sendFile()`
- A cache layer configured through `cache` options and used through the exported `cache` singleton
- Throttling, retention, and error tracking options for production-oriented apps
- HTTP or HTTPS server startup through `protocol` and `ssl`

## Documentation

- Getting started: [docs.trivajs.com/getting-started](https://docs.trivajs.com/getting-started)
- Installation: [docs.trivajs.com/installation](https://docs.trivajs.com/installation)
- Core API: [docs.trivajs.com/core/api](https://docs.trivajs.com/core/api)
- Configuration: [docs.trivajs.com/core/configuration](https://docs.trivajs.com/core/configuration)
- Database adapters: [docs.trivajs.com/database/adapters](https://docs.trivajs.com/database/adapters)
- Extensions: [docs.trivajs.com/extensions/overview](https://docs.trivajs.com/extensions/overview)

## Repository Guide

- Framework source: `lib/`
- Type declarations: `types/`
- Examples: `examples/`
- Documentation site: `docs/`
- Marketing site: `web/`
- Benchmarks: `benchmark/`
- Tests: `test/`
