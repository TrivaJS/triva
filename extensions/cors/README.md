# @trivajs/cors

CORS middleware for [Triva](https://github.com/yourusername/triva) framework. Handles Cross-Origin Resource Sharing with full configuration support.

## Installation

```bash
npm install @trivajs/cors triva
```

## Quick Start

```javascript
import { build, get, use, listen } from 'triva';
import { cors } from '@trivajs/cors';

await build();

// Enable CORS for all routes
use(cors());

get('/api/data', (req, res) => {
  res.json({ message: 'CORS enabled!' });
});

listen(3000);
```

## Features

✅ **Simple & Flexible** - Works seamlessly with Triva middleware system  
✅ **Zero Dependencies** - Lightweight, no external dependencies  
✅ **Full Configuration** - Complete control over CORS headers  
✅ **Pre-configured Modes** - Development, strict, multi-origin, dynamic  
✅ **Preflight Handling** - Automatic OPTIONS request handling  
✅ **Origin Validation** - String, Array, RegExp, or Function validation  

## Usage

### Basic Configuration

```javascript
import { cors } from '@trivajs/cors';

// Allow all origins (default)
use(cors());

// Specific origin
use(cors({
  origin: 'https://example.com'
}));

// Multiple origins
use(cors({
  origin: ['https://example.com', 'https://app.example.com']
}));

// RegExp pattern
use(cors({
  origin: /\.example\.com$/
}));

// Dynamic validation
use(cors({
  origin: (requestOrigin) => {
    return requestOrigin.endsWith('.trusted-domain.com');
  }
}));
```

### Advanced Configuration

```javascript
use(cors({
  // Origin validation
  origin: 'https://example.com',
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  
  // Allowed request headers
  allowedHeaders: ['Content-Type', 'Authorization'],
  
  // Headers exposed to the client
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining'],
  
  // Preflight cache duration (seconds)
  maxAge: 86400,
  
  // Pass preflight to next handler
  preflightContinue: false,
  
  // Preflight response status code
  optionsSuccessStatus: 204
}));
```

### Pre-configured Modes

#### Development Mode (Allow All)

```javascript
import { corsDevMode } from '@trivajs/cors';

use(corsDevMode());
// Allows all origins, methods, headers
```

#### Strict Mode (Single Origin)

```javascript
import { corsStrict } from '@trivajs/cors';

use(corsStrict('https://app.example.com'));
// Credentials enabled, limited methods
```

#### Multi-Origin Mode

```javascript
import { corsMultiOrigin } from '@trivajs/cors';

use(corsMultiOrigin([
  'https://app.example.com',
  'https://admin.example.com'
]));
```

#### Dynamic Mode

```javascript
import { corsDynamic } from '@trivajs/cors';

use(corsDynamic((origin) => {
  // Custom validation logic
  const allowedDomains = ['example.com', 'trusted.com'];
  return allowedDomains.some(domain => origin.endsWith(domain));
}));
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | string \| array \| RegExp \| Function | `'*'` | Allowed origin(s) |
| `methods` | string[] | `['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']` | Allowed methods |
| `allowedHeaders` | string[] | `[]` | Allowed request headers (empty = reflect request) |
| `exposedHeaders` | string[] | `[]` | Headers exposed to client |
| `credentials` | boolean | `false` | Allow credentials |
| `maxAge` | number \| null | `null` | Preflight cache duration (seconds) |
| `preflightContinue` | boolean | `false` | Pass preflight to next handler |
| `optionsSuccessStatus` | number | `204` | Preflight response status |

## Examples

### API with Authentication

```javascript
import { build, get, post, use, listen } from 'triva';
import { cors } from '@trivajs/cors';

await build();

// CORS with credentials for authentication
use(cors({
  origin: 'https://app.example.com',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

get('/api/user', (req, res) => {
  // Cookies and auth headers allowed
  res.json({ user: 'authenticated' });
});

listen(3000);
```

### Multiple Environments

```javascript
import { cors, corsDevMode, corsStrict } from '@trivajs/cors';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  use(corsDevMode()); // Allow all in development
} else {
  use(corsStrict('https://production.example.com')); // Strict in production
}
```

### Route-Specific CORS

```javascript
import { get, use } from 'triva';
import { cors, corsDevMode } from '@trivajs/cors';

// Public API - allow all
get('/api/public/data', use(corsDevMode()), (req, res) => {
  res.json({ public: true });
});

// Private API - strict CORS
get('/api/private/data', use(cors({
  origin: 'https://app.example.com',
  credentials: true
})), (req, res) => {
  res.json({ private: true });
});
```

### Dynamic Origin with Database

```javascript
import { corsDynamic } from '@trivajs/cors';

// Check origin against database
use(corsDynamic(async (origin) => {
  const allowedOrigins = await db.getAllowedOrigins();
  return allowedOrigins.includes(origin);
}));
```

### Subdomain Wildcard

```javascript
use(cors({
  origin: /^https:\/\/.*\.example\.com$/
}));
// Allows: https://app.example.com, https://admin.example.com
// Blocks: https://malicious.com
```

## How It Works

1. **Origin Check** - Validates request origin against configuration
2. **Set Headers** - Adds appropriate CORS headers to response
3. **Preflight** - Handles OPTIONS requests for preflight
4. **Next** - Calls next middleware or route handler

## Security Best Practices

❌ **Don't** use `origin: '*'` with `credentials: true`  
✅ **Do** specify exact origins in production  

❌ **Don't** expose sensitive headers unnecessarily  
✅ **Do** limit `exposedHeaders` to what's needed  

❌ **Don't** allow all methods by default  
✅ **Do** specify only required methods  

## Troubleshooting

### CORS Error: Origin Not Allowed

Check that your origin is exactly configured:
```javascript
// Wrong (missing protocol)
origin: 'example.com'

// Correct
origin: 'https://example.com'
```

### Credentials Not Working

Ensure both are set:
```javascript
use(cors({
  origin: 'https://example.com', // NOT '*'
  credentials: true
}));
```

And in client:
```javascript
fetch('https://api.example.com', {
  credentials: 'include'
});
```

### Preflight Failing

Add your headers to `allowedHeaders`:
```javascript
use(cors({
  allowedHeaders: ['Content-Type', 'X-Custom-Header']
}));
```

## Testing

```bash
# Run tests
npm test

# Run example
npm run example
```

## License

MIT License - see LICENSE file

## Contributing

Issues and PRs welcome! See main [Triva repository](https://github.com/yourusername/triva) for contribution guidelines.

## Related

- [Triva Framework](https://github.com/yourusername/triva) - Main framework
- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
