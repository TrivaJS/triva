# Triva Quick Start Guide

Welcome to Triva! This guide will get you up and running in minutes.

## Installation

```bash
npm install triva
```

## Your First Server

Create a file `server.js`:

```javascript
import { build, middleware, get, listen } from 'triva';

// Initialize
build({ env: 'development' });

// Add middleware
middleware({
  throttle: {
    limit: 100,
    window_ms: 60000
  }
});

// Add a route
get('/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// Start server
listen(3000);
```

Run it:
```bash
node server.js
```

Visit: http://localhost:3000/hello

## Adding More Routes

```javascript
import { get, post, put, del } from 'triva';

// GET with params
get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

// POST with body
post('/users', async (req, res) => {
  const body = await req.json();
  res.status(201).json({ created: true, user: body });
});

// PUT
put('/users/:id', async (req, res) => {
  const body = await req.json();
  res.json({ updated: true, id: req.params.id, data: body });
});

// DELETE
del('/users/:id', (req, res) => {
  res.json({ deleted: true, id: req.params.id });
});
```

## Using the Cache

```javascript
import { cache, configCache } from 'triva';

// Configure
configCache({
  cache_type: 'memory',
  cache_limit: 100000
});

// Use in routes
get('/data/:id', async (req, res) => {
  const id = req.params.id;
  
  // Try cache first
  let data = await cache.get(`data:${id}`);
  
  if (!data) {
    // Fetch from database
    data = await fetchFromDatabase(id);
    
    // Store in cache for 1 hour
    await cache.set(`data:${id}`, data, 3600000);
  }
  
  res.json(data);
});
```

## Accessing Logs

```javascript
import { log } from 'triva';

// Get all logs
get('/admin/logs', async (req, res) => {
  const logs = await log.get('all');
  res.json(logs);
});

// Get recent errors
get('/admin/errors', async (req, res) => {
  const errors = await log.get({
    status: [400, 404, 500, 503],
    limit: 100
  });
  res.json(errors);
});

// Get statistics
get('/admin/stats', async (req, res) => {
  const stats = await log.getStats();
  res.json(stats);
});
```

## Advanced Throttling

```javascript
middleware({
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 20,
    burst_window_ms: 1000,
    
    // Custom policies
    policies: ({ ip, ua, context }) => {
      // API endpoints get lower limits
      if (context.pathname?.startsWith('/api/')) {
        return { limit: 50 };
      }
      
      // Bots get stricter limits
      if (ua?.toLowerCase().includes('bot')) {
        return { 
          limit: 10,
          weight_multiplier: 2 
        };
      }
      
      return null; // Use default
    }
  }
});
```

## Error Handling

```javascript
import { setErrorHandler, setNotFoundHandler } from 'triva';

// Custom error handler
setErrorHandler((err, req, res) => {
  console.error('Error:', err);
  
  res.status(500).json({
    error: 'Something went wrong',
    requestId: Math.random().toString(36).substring(7)
  });
});

// Custom 404 handler
setNotFoundHandler((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url,
    message: 'This endpoint does not exist'
  });
});
```

## Request/Response Helpers

```javascript
get('/example', async (req, res) => {
  // Access params
  const id = req.params.id;
  
  // Access query
  const page = req.query.page || 1;
  
  // Parse JSON body
  const body = await req.json();
  
  // Set status
  res.status(201);
  
  // Set headers
  res.header('X-Custom-Header', 'value');
  
  // Send JSON
  res.json({ success: true });
  
  // Or send text
  // res.send('Hello');
  
  // Or send HTML
  // res.html('<h1>Hello</h1>');
  
  // Or redirect
  // res.redirect('/other-page');
});
```

## Complete Example

```javascript
import { 
  build, 
  middleware, 
  get, 
  post, 
  listen,
  cache,
  configCache,
  log 
} from 'triva';

// Setup
build({ env: 'production' });

configCache({
  cache_type: 'memory',
  cache_limit: 100000
});

middleware({
  retention: {
    enabled: true,
    maxEntries: 50000
  },
  throttle: {
    limit: 100,
    window_ms: 60000,
    burst_limit: 20,
    burst_window_ms: 1000
  }
});

// Routes
get('/api/items', async (req, res) => {
  const cached = await cache.get('items');
  
  if (cached) {
    return res.json(cached);
  }
  
  const items = await fetchItems();
  await cache.set('items', items, 300000); // 5 min
  
  res.json(items);
});

post('/api/items', async (req, res) => {
  const body = await req.json();
  const item = await createItem(body);
  
  // Invalidate cache
  await cache.delete('items');
  
  res.status(201).json(item);
});

get('/admin/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

get('/admin/metrics', async (req, res) => {
  const [logStats, cacheStats] = await Promise.all([
    log.getStats(),
    cache.stats()
  ]);
  
  res.json({ logs: logStats, cache: cacheStats });
});

// Start
listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out [example.js](./example.js) for a complete working example
- Run tests with `npm test`
- Explore the [TypeScript definitions](./index.d.ts) for type safety

## Need Help?

- Check the documentation
- Open an issue on GitHub
- Review the example application
- Read the source code (it's clean and well-commented!)

Happy coding! 🚀
