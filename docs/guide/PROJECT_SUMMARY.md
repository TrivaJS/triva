# Triva - Project Summary

## Overview

Triva is an enterprise-grade Node.js HTTP server framework that prioritizes developer visibility, data collection, and maximum configurability. It's designed for production environments where monitoring, rate limiting, and performance are critical.

## Architecture

### Core Components

1. **triva.js** - Main server framework
   - HTTP server creation and management
   - Routing system with pattern matching
   - Middleware pipeline
   - Request/response enhancement
   - Error handling

2. **middleware.js** - Middleware and throttling
   - Advanced throttling with multiple layers
   - Sliding window rate limiting
   - Burst protection
   - Auto-ban system
   - User-agent rotation detection
   - Custom policy engine

3. **cache.js** - Caching system
   - Multiple backend support (Local, Memory/LRU)
   - TTL support
   - Pattern-based operations
   - Automatic cleanup
   - Statistics tracking

4. **triva.log.js** - Logging system
   - Comprehensive request logging
   - Retention management
   - Advanced filtering
   - Search capabilities
   - Analytics and statistics

## Key Features

### 1. Intelligent Throttling

**Multi-Layer Protection:**
- Sliding window rate limiting (precise, no fixed-interval resets)
- Burst protection (prevents spike attacks)
- Auto-ban system (automatic IP banning)
- UA rotation detection (identifies distributed scraping)

**Smart Request Weighting:**
- Automatic bot/crawler detection
- AI service detection (OpenAI, Anthropic, etc.)
- Custom weight multipliers
- Weighted request counting

**Custom Policies:**
```javascript
policies: ({ ip, ua, context }) => {
  // Per-endpoint limits
  if (context.pathname?.includes('/heavy')) {
    return { limit: 10 };
  }
  // Per-user-agent limits
  if (ua?.includes('bot')) {
    return { weight_multiplier: 2 };
  }
  return null;
}
```

### 2. Comprehensive Logging

**Automatic Request Tracking:**
- Timestamps and response times
- HTTP method and status codes
- IP addresses and user agents
- Query parameters and paths
- Throttle decisions

**Powerful Querying:**
```javascript
// Filter by multiple criteria
await log.get({
  method: ['GET', 'POST'],
  status: [200, 201],
  from: Date.now() - 3600000,
  limit: 100
});

// Search across all fields
await log.search('error');

// Get analytics
await log.getStats();
```

### 3. Flexible Caching

**Multiple Backends:**
- **Local:** Simple Map-based, no eviction
- **Memory (LRU):** Least Recently Used eviction, enforces size limits

**Advanced Operations:**
```javascript
// TTL support
await cache.set('key', value, 3600000);

// Pattern matching
await cache.keys('user:.*');

// Statistics
await cache.stats();
```

### 4. Developer-Friendly API

**Express-Like Routing:**
```javascript
get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});
```

**Enhanced Request/Response:**
```javascript
// Parse JSON
const body = await req.json();

// Send responses
res.status(201).json({ created: true });
res.send('text');
res.html('<h1>HTML</h1>');
res.redirect('/path');
```

## Design Principles

1. **Maximum Configurability**
   - Every feature can be tuned
   - Sensible defaults provided
   - Easy to start, powerful when needed

2. **Developer Visibility**
   - Comprehensive logging
   - Real-time statistics
   - Query capabilities
   - Searchable history

3. **Enterprise Ready**
   - Production-tested patterns
   - Performance-focused
   - Memory-efficient
   - Robust error handling

4. **Zero Dependencies**
   - Core Node.js only
   - No external dependencies
   - Full control over behavior
   - Easy to audit and maintain

## File Structure

```
triva/
├── triva.js              # Main framework (10KB)
│   ├── TrivaServer       # Server class
│   ├── RouteMatcher      # Routing engine
│   ├── RequestContext    # Request enhancement
│   └── ResponseHelpers   # Response methods
│
├── middleware.js         # Middleware system (6KB)
│   ├── Throttle          # Throttling engine
│   └── MiddlewareCore    # Integration layer
│
├── cache.js              # Caching system (8KB)
│   ├── LocalCache        # Map-based cache
│   ├── MemoryCache       # LRU cache
│   └── CacheManager      # Manager/facade
│
├── triva.log.js          # Logging system (5KB)
│   ├── LogEntry          # Entry structure
│   └── LogStorage        # Storage and querying
│
├── example.js            # Full example app (5KB)
├── test.js               # Test suite (5KB)
├── index.d.ts            # TypeScript definitions (7KB)
│
├── package.json          # NPM configuration
├── README.md             # Full documentation
├── QUICKSTART.md         # Quick start guide
├── CONTRIBUTING.md       # Contribution guidelines
├── CHANGELOG.md          # Version history
└── LICENSE               # MIT License
```

## Usage Patterns

### Basic Server
```javascript
import { build, get, listen } from 'triva';

build({ env: 'development' });
get('/hello', (req, res) => res.send('Hello!'));
listen(3000);
```

### With Throttling
```javascript
import { build, middleware, get, listen } from 'triva';

build();
middleware({
  throttle: {
    limit: 100,
    window_ms: 60000
  }
});
get('/api/data', handler);
listen(3000);
```

### Full Stack
```javascript
import { 
  build, 
  middleware, 
  get, 
  listen,
  cache,
  configCache,
  log 
} from 'triva';

// Configure everything
build({ env: 'production' });
configCache({ cache_type: 'memory', cache_limit: 100000 });
middleware({ 
  throttle: { limit: 100, window_ms: 60000 },
  retention: { enabled: true, maxEntries: 50000 }
});

// Use all features
get('/api/data', async (req, res) => {
  const cached = await cache.get('data');
  if (cached) return res.json(cached);
  
  const data = await fetchData();
  await cache.set('data', data, 300000);
  res.json(data);
});

get('/metrics', async (req, res) => {
  res.json(await log.getStats());
});

listen(3000);
```

## Performance Characteristics

- **Routing:** O(n) linear scan (optimized for small route counts)
- **Throttling:** O(1) hash-based lookups
- **Cache:** O(1) get/set operations
- **Logging:** O(1) append, O(n) queries
- **Memory:** Configurable limits with automatic cleanup

## Future Roadmap

### Phase 1 (v1.x)
- ✅ Core framework
- ✅ Advanced throttling
- ✅ Logging system
- ✅ Cache system
- ✅ TypeScript definitions

### Phase 2 (v2.x)
- [ ] Redis cache backend
- [ ] WebSocket support
- [ ] Request/response compression
- [ ] HTTPS support
- [ ] TypeScript migration

### Phase 3 (v3.x)
- [ ] Clustering support
- [ ] Cookie/session management
- [ ] Static file serving
- [ ] File upload handling
- [ ] Monitoring dashboard

## Security Considerations

1. **Throttling:** Protects against DDoS and abuse
2. **Auto-ban:** Automatic threat mitigation
3. **UA rotation detection:** Identifies distributed attacks
4. **Input validation:** User should validate all inputs
5. **Error handling:** Safe error messages (no stack traces in production)

## Migration Path

Triva is designed to be migration-friendly:

1. **From Express:**
   - Similar routing API
   - Compatible middleware pattern
   - Familiar request/response objects

2. **To TypeScript:**
   - Complete type definitions included
   - Gradual migration supported
   - Type-safe by design

## Testing

Run the test suite:
```bash
npm test
```

Run the example:
```bash
npm run example
```

Test endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Test throttling
for i in {1..10}; do curl http://localhost:3000/test; done

# View logs
curl http://localhost:3000/logs/stats
```

## Support and Community

- **Documentation:** Complete README and examples
- **Type Safety:** Full TypeScript definitions
- **Testing:** Comprehensive test suite
- **Examples:** Real-world usage patterns
- **Contributing:** Guidelines included

## License

MIT License - see LICENSE file for details

---

**Triva** - Built for enterprise developers who need visibility, control, and reliability.
