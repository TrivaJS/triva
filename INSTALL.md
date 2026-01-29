# Installation Guide

## Quick Install

```bash
# 1. Extract the package
tar -xzf triva-final.tar.gz
# or
unzip triva-final.zip

# 2. Navigate to your project
cd your-project

# 3. Install Triva locally
npm install ../path/to/triva-final

# OR using npm link for development
cd ../triva-final
npm link
cd ../your-project
npm link triva
```

## Verify Installation

Create `test.js`:

```javascript
import { build, get, listen } from 'triva';

build();

get('/', (req, res) => {
  res.json({ message: 'Triva is installed!' });
});

listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

Run:
```bash
node test.js
```

Visit: http://localhost:3000

## File Structure

```
triva-final/
├── lib/                      # Core library files
│   ├── index.js             # Main server
│   ├── middleware.js        # Middleware & throttling
│   ├── cache.js             # Caching system
│   ├── log.js               # Logging system
│   ├── error-tracker.js     # Error tracking
│   ├── cookie-parser.js     # Cookie parsing
│   └── ua-parser.js         # User agent parsing
├── test/
│   └── example.js           # Example server
├── package.json
├── index.d.ts               # TypeScript definitions
├── README.md
├── LICENSE
└── .gitignore
```

## All Updated Files

### Core Library (lib/)
- ✅ **index.js** - Main server with all new response methods
- ✅ **middleware.js** - Updated with UA parser integration
- ✅ **cache.js** - Cache management (unchanged)
- ✅ **log.js** - Updated with export() and cookie support
- ✅ **error-tracker.js** - Complete error tracking system
- ✅ **cookie-parser.js** - NEW - Cookie parsing
- ✅ **ua-parser.js** - User agent parsing

### Package Files
- ✅ **package.json** - Updated with all exports
- ✅ **index.d.ts** - Complete TypeScript definitions
- ✅ **README.md** - Full documentation
- ✅ **LICENSE** - MIT License

### Test
- ✅ **test/example.js** - Working example server

## What's New

### New Response Methods
- `res.download(filepath, filename)` - Download files
- `res.sendFile(filepath, options)` - Send files
- `res.jsonp(data, callbackParam)` - JSONP responses
- `res.cookie(name, value, options)` - Set cookies
- `res.clearCookie(name, options)` - Clear cookies

### New Features
- Cookie parsing with `cookieParser()` middleware
- Cookies automatically logged in all requests
- Log export with `log.export(filter, filename)`
- Separate error and log storage
- Full custom middleware support

### Enhanced Features
- UA data in throttle and logs
- Error tracking with full context
- Auto-detect HTML in `res.send()`

## Usage Examples

### Minimal Server
```javascript
import { build, get, listen } from 'triva';

build();
get('/', (req, res) => res.json({ ok: true }));
listen(3000);
```

### With All Features
```javascript
import { 
  build,
  middleware,
  use,
  get,
  listen,
  cookieParser,
  log
} from 'triva';

build({ env: 'development' });

use(cookieParser());

middleware({
  retention: { enabled: true, maxEntries: 10000 },
  throttle: { limit: 100, window_ms: 60000 }
});

get('/', (req, res) => {
  res.cookie('visited', 'true', { maxAge: 86400000 });
  res.json({ cookies: req.cookies });
});

get('/download', (req, res) => {
  res.download('./file.pdf', 'download.pdf');
});

get('/logs/export', async (req, res) => {
  const result = await log.export({ limit: 100 });
  res.json({ exported: result.count });
});

listen(3000);
```

## Troubleshooting

### Import Errors
Make sure you're using Node.js 18+ and have `"type": "module"` in your package.json.

### Cannot Find Module
Verify Triva is installed:
```bash
npm list triva
```

### Port Already in Use
Change the port:
```javascript
listen(3001); // Use different port
```

## Next Steps

1. Check `test/example.js` for a working example
2. Read `README.md` for complete API documentation
3. Run the example: `node test/example.js`

Enjoy using Triva! 🚀
