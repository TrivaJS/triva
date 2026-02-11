# Update Notifier

Safe, non-intrusive update checking system that notifies developers when new versions are available.

## How It Works

1. **Checks npm registry** - Uses official npm API to get latest version
2. **Smart caching** - Only checks once per 24 hours
3. **Environment aware** - Only runs in development/test
4. **Non-blocking** - Never delays server startup
5. **Fail-safe** - Network errors won't break your app

## Features

✅ **Automatic** - Runs on every `build()` call  
✅ **Respectful** - Only checks in development  
✅ **Smart** - Caches results for 24 hours  
✅ **Safe** - Timeouts after 3 seconds  
✅ **Informative** - Shows current vs latest version  
✅ **Disableable** - Easy to turn off  

## When Checks Run

### ✅ Checks Enabled
- `NODE_ENV=development` (default)
- `NODE_ENV=test`
- Local development

### ❌ Checks Disabled
- `NODE_ENV=production`
- CI environments (GitHub Actions, Travis, Jenkins, etc.)
- When `TRIVA_DISABLE_UPDATE_CHECK=true`
- After 24 hours since last check

## Example Output

### Patch Update Available
```
┌─────────────────────────────────────────────────────┐
│  🔧  Triva Update Available (Patch - may include security fixes) │
├─────────────────────────────────────────────────────┤
│  Current: 1.0.0                                     │
│  Latest:  1.0.1                                     │
├─────────────────────────────────────────────────────┤
│  Update now:                                        │
│    npm install triva@latest                         │
│                                                     │
│  Or add to package.json:                            │
│    "triva": "^1.0.1"                                │
├─────────────────────────────────────────────────────┤
│  To disable this notification:                      │
│    export TRIVA_DISABLE_UPDATE_CHECK=true           │
└─────────────────────────────────────────────────────┘
```

### Major Update Available
```
┌─────────────────────────────────────────────────────┐
│  🚀  Triva Update Available (MAJOR UPDATE)          │
├─────────────────────────────────────────────────────┤
│  Current: 1.0.0                                     │
│  Latest:  2.0.0                                     │
├─────────────────────────────────────────────────────┤
│  Update now:                                        │
│    npm install triva@latest                         │
│                                                     │
│  Or add to package.json:                            │
│    "triva": "^2.0.0"                                │
├─────────────────────────────────────────────────────┤
│  To disable this notification:                      │
│    export TRIVA_DISABLE_UPDATE_CHECK=true           │
└─────────────────────────────────────────────────────┘
```

## Disabling Notifications

### Temporarily (Current Terminal)
```bash
export TRIVA_DISABLE_UPDATE_CHECK=true
node server.js
```

### Permanently (Add to .bashrc or .zshrc)
```bash
echo 'export TRIVA_DISABLE_UPDATE_CHECK=true' >> ~/.bashrc
```

### In Code
```javascript
// Set before importing Triva
process.env.TRIVA_DISABLE_UPDATE_CHECK = 'true';

import { build } from 'triva';
```

### In package.json scripts
```json
{
  "scripts": {
    "dev": "TRIVA_DISABLE_UPDATE_CHECK=true node server.js",
    "start": "node server.js"
  }
}
```

## Manual Checking

### Check Cache Status
```javascript
import { getCacheStatus } from 'triva/lib/update-check.js';

console.log(getCacheStatus());
// {
//   exists: true,
//   lastCheck: "2025-02-11T05:30:00.000Z",
//   nextCheck: "2025-02-12T05:30:00.000Z",
//   lastVersion: "1.0.1"
// }
```

### Force New Check
```javascript
import { clearCache, checkForUpdates } from 'triva/lib/update-check.js';

// Clear cache
clearCache();

// Force check
await checkForUpdates('1.0.0');
```

## How Update Urgency is Determined

| Version Change | Urgency | Emoji | Message |
|----------------|---------|-------|---------|
| 1.0.0 → 2.0.0 | Major | 🚀 | MAJOR UPDATE |
| 1.0.0 → 1.1.0 | Minor | 📦 | (none) |
| 1.0.0 → 1.0.1 | Patch | 🔧 | may include security fixes |

## Cache Location

**Linux/Mac:** `/tmp/.triva-update-cache/last-check.json`  
**Windows:** `%TEMP%\.triva-update-cache\last-check.json`

## Security & Privacy

### What It Does
✅ Makes HTTPS request to `registry.npmjs.org`  
✅ Reads package version from npm's public API  
✅ Compares versions locally  
✅ Caches result in temp directory  

### What It Doesn't Do
❌ Download code  
❌ Execute remote code  
❌ Modify your application  
❌ Send analytics or telemetry  
❌ Track usage  
❌ Access your files  

### Network Request
```
GET https://registry.npmjs.org/triva/latest
User-Agent: Triva-Update-Notifier
Accept: application/json
```

**Response** (public npm data):
```json
{
  "version": "1.0.1",
  "time": {
    "modified": "2025-02-11T05:00:00.000Z"
  },
  "homepage": "https://github.com/trivajs/triva",
  "repository": {
    "url": "git+https://github.com/trivajs/triva.git"
  }
}
```

## Troubleshooting

### Notification Not Showing

**Reason 1: Running in production**
```bash
# Check environment
echo $NODE_ENV
# If 'production', notifications are disabled by design
```

**Reason 2: Checked in last 24 hours**
```bash
# Clear cache to force new check
node -e "require('fs').rmSync('/tmp/.triva-update-cache', {recursive: true})"
```

**Reason 3: Network firewall**
```bash
# Test npm registry access
curl https://registry.npmjs.org/triva/latest
```

**Reason 4: Disabled by environment variable**
```bash
# Check if disabled
echo $TRIVA_DISABLE_UPDATE_CHECK
# If 'true', unset it
unset TRIVA_DISABLE_UPDATE_CHECK
```

### Always Shows Update

**Reason: Version mismatch in package.json**
```bash
# Check installed version
npm list triva
# Update to latest
npm install triva@latest
```

## Best Practices

### For Package Users

1. **Keep updated** - Run `npm install triva@latest` regularly
2. **Read changelogs** - Check what changed before updating
3. **Test updates** - Try in development before production
4. **Pin versions** - Use exact versions in production

### For CI/CD

Notifications are **automatically disabled** in:
- GitHub Actions
- Travis CI
- CircleCI
- Jenkins
- GitLab CI
- Any environment with `CI=true`

No configuration needed!

### For Teams

**Option 1: Disable for everyone**
```javascript
// config/triva.js
process.env.TRIVA_DISABLE_UPDATE_CHECK = 'true';
```

**Option 2: Use Dependabot**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
```

## Implementation Details

### Performance
- ⚡ **Non-blocking** - Uses async/await, doesn't delay startup
- ⚡ **Fast** - 3-second timeout, cached for 24 hours
- ⚡ **Lightweight** - ~300 lines, no dependencies

### Reliability
- ✅ Never crashes your app
- ✅ Handles network errors gracefully
- ✅ Handles JSON parsing errors
- ✅ Handles file system errors
- ✅ Fails silently

### Privacy
- 🔒 No analytics
- 🔒 No tracking
- 🔒 No data collection
- 🔒 Only checks npm's public API

## Why This Approach?

### ✅ Advantages
- Secure (uses npm's official API)
- Trustworthy (no code modification)
- Respectful (easy to disable)
- Helpful (notifies of security patches)
- Standard (many packages do this)

### ❌ Why Not Alternatives?
- **Auto-update**: Dangerous, breaks deterministic builds
- **Remote code loading**: Security nightmare, violates npm ToS
- **Telemetry**: Privacy concerns, trust issues
- **Forced updates**: Breaks user control

## Examples in the Wild

Popular packages using similar systems:
- `npm` (npm itself checks for updates)
- `yeoman` (update-notifier package)
- `gatsby` (checks for updates)
- `create-react-app` (notifies of new versions)

## FAQ

**Q: Will this slow down my server?**  
A: No. It's async and non-blocking. Even if the check takes 3 seconds, your server starts immediately.

**Q: What if npm registry is down?**  
A: Request times out after 3 seconds, fails silently. Your app continues normally.

**Q: Does this send any data about me?**  
A: No. It only reads public data from npm's registry. No analytics, no tracking.

**Q: Can I opt out?**  
A: Yes. Set `TRIVA_DISABLE_UPDATE_CHECK=true` or run in production mode.

**Q: Why check every 24 hours?**  
A: Balance between staying informed and not being annoying. You can clear cache to force immediate check.

**Q: What about security patches?**  
A: Patch updates show "may include security fixes" to encourage quick updates.

## Related

- [npm update documentation](https://docs.npmjs.com/cli/v9/commands/npm-update)
- [Semantic Versioning](https://semver.org/)
- [npm registry API](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md)
