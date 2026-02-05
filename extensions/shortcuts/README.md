# @trivajs/shortcuts

IDE snippets and shortcuts for [Triva](https://github.com/yourusername/triva) framework. Automatically installs code snippets to VS Code, VS Code Insiders, and Atom.

## Installation

```bash
npm install @trivajs/shortcuts
```

The snippets will automatically install to your IDE(s) on `npm install` and automatically uninstall on `npm uninstall`.

## Supported IDEs

✅ **VS Code** - Detects and installs to `User/snippets/`  
✅ **VS Code Insiders** - Detects and installs separately  
✅ **Atom** - Installs to `~/.atom/snippets.cson`  

## Available Snippets

### Server Setup

| Prefix | Description |
|--------|-------------|
| `triva-build` | Build and configure Triva server |
| `triva-server` | Create basic Triva server |
| `triva-config` | Full Triva configuration |

### Routes

| Prefix | Description |
|--------|-------------|
| `triva-get` | Create GET route |
| `triva-post` | Create POST route with body parsing |
| `triva-put` | Create PUT route with params |
| `triva-del` | Create DELETE route |
| `triva-auth` | Protected route with authentication |

### Middleware

| Prefix | Description |
|--------|-------------|
| `triva-middleware` | Create middleware function |
| `triva-cors` | Add CORS middleware |
| `triva-cookies` | Cookie parser middleware |

### Cache

| Prefix | Description |
|--------|-------------|
| `triva-cache-get` | Get value from cache |
| `triva-cache-set` | Set value in cache with TTL |
| `triva-cache-pattern` | Cache pattern with get/set |

### Database Adapters

| Prefix | Description |
|--------|-------------|
| `triva-mongodb` | Configure MongoDB cache |
| `triva-redis` | Configure Redis cache |
| `triva-postgres` | Configure PostgreSQL cache |

### Features

| Prefix | Description |
|--------|-------------|
| `triva-errors` | Configure error tracking |
| `triva-logging` | Configure request logging |
| `triva-throttle` | Configure rate limiting |
| `triva-throttle-policy` | Rate limiting with policies |

## Usage

In VS Code or Atom, simply type the prefix and press `Tab` to expand the snippet.

### Example: Create Basic Server

1. Type `triva-server` and press `Tab`
2. Fill in the placeholders (route, response, port)
3. Press `Tab` to move between placeholders

```javascript
import { build, get, post, listen } from 'triva';

await build({
  cache: { type: 'memory' }
});

get('/api', (req, res) => {
  res.json({ message: 'Hello' });
});

listen(3000);
```

### Example: Add CORS

1. Type `triva-cors` and press `Tab`
2. Configure origin, credentials, methods

```javascript
import { cors } from '@trivajs/cors';

use(cors({
  origin: 'https://example.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Example: Cache Pattern

1. Type `triva-cache-pattern` and press `Tab`
2. Configure cache key, data source, TTL

```javascript
const cacheKey = 'users:123';

const cached = await cache.get(cacheKey);
if (cached) {
  return res.json({ source: 'cache', data: cached });
}

const data = await db.getUser(123);
await cache.set(cacheKey, data, 3600000);

res.json({ source: 'database', data });
```

## How It Works

### Automatic Detection

The package automatically detects your IDE(s) by:

1. **Environment variables** (high confidence)
   - `VSCODE_CWD`, `TERM_PROGRAM`, `ATOM_HOME`

2. **Filesystem checks** (lower confidence)
   - VS Code config directories
   - Atom config directories

3. **Fallback behavior**
   - If no IDE detected → installs to ALL supported IDEs
   - Ensures snippets are available even if detection fails

### Installation Paths

**VS Code (Windows):**
```
%APPDATA%\Code\User\snippets\javascript.json
%APPDATA%\Code\User\snippets\typescript.json
```

**VS Code (macOS):**
```
~/Library/Application Support/Code/User/snippets/javascript.json
~/Library/Application Support/Code/User/snippets/typescript.json
```

**VS Code (Linux):**
```
~/.config/Code/User/snippets/javascript.json
~/.config/Code/User/snippets/typescript.json
```

**Atom (All platforms):**
```
~/.atom/snippets.cson
```

### Update Behavior

When you update `@trivajs/shortcuts`:
- **New snippets** are added
- **Changed snippets** are updated
- **Existing snippets** are preserved (no duplicates)
- **Removed snippets** stay until package is uninstalled

### Uninstallation

```bash
npm uninstall @trivajs/shortcuts
```

Automatically removes all Triva snippets from your IDE(s) on uninstall.

## Manual Installation

If automatic installation doesn't work, you can manually add snippets:

### VS Code

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Select "Preferences: Configure User Snippets"
3. Choose "javascript.json" or "typescript.json"
4. Copy snippets from `triva/snippets/triva.json`

### Atom

1. Open `~/.atom/snippets.cson`
2. Add Triva snippets under `.source.js:` or `.source.ts:`
3. Save and reload Atom

## Snippet Format

Snippets use standard VS Code format with:
- **Placeholders** - `${1:default}` - Tab to navigate
- **Choices** - `${1|option1,option2|}` - Select from list
- **Variables** - `$0` - Final cursor position

## Troubleshooting

### Snippets Not Appearing

**VS Code:**
1. Restart VS Code
2. Check: `File > Preferences > User Snippets`
3. Verify snippets in `javascript.json` or `typescript.json`

**Atom:**
1. Reload Atom (`Ctrl+Shift+F5` / `Cmd+Shift+F5`)
2. Check `~/.atom/snippets.cson`
3. Verify correct CSON syntax

### Permission Errors

Run npm with appropriate permissions:
```bash
# Linux/macOS
sudo npm install @trivajs/shortcuts

# Windows (as Administrator)
npm install @trivajs/shortcuts
```

### Multiple IDEs

If you have multiple IDEs, snippets install to all detected IDEs. This is intentional to ensure availability.

## Development

### Add New Snippets

Edit `triva/snippets/triva.json`:

```json
{
  "Snippet Name": {
    "prefix": "trigger-text",
    "body": [
      "line 1",
      "line 2 with ${1:placeholder}",
      "$0"
    ],
    "description": "What this snippet does"
  }
}
```

### Test Locally

```bash
cd extensions/shortcuts
npm install
# Snippets auto-install to your IDE
```

## Contributing

To add snippets:

1. Edit `snippets/triva.json` (in main Triva repo)
2. Follow VS Code snippet format
3. Test installation
4. Submit PR

## Related

- [Triva Framework](https://github.com/yourusername/triva) - Main framework
- [@trivajs/cors](https://npmjs.com/package/@trivajs/cors) - CORS middleware
- [@trivajs/cli](https://npmjs.com/package/@trivajs/cli) - CLI tools

## License

MIT License - see LICENSE file
