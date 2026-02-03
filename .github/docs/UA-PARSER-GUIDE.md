# User Agent Parser Integration

Triva includes a built-in User Agent (UA) parser that provides detailed information about every request.

## 🎯 What It Does

The UA parser analyzes the `User-Agent` header from every request and extracts:
- **Browser** - Name, version, major version
- **Engine** - Rendering engine (Blink, Gecko, WebKit)
- **OS** - Operating system name and version
- **Device** - Type (desktop, mobile, tablet)
- **CPU** - Architecture (amd64, arm, x86)
- **Bot Detection** - Identifies bots, AI crawlers, search engines

## 🔄 How It Works

### Automatic Integration

UA parsing happens automatically in two places:

1. **Middleware/Throttle** - Parsed when checking rate limits
2. **Logging** - Included in every log entry

### Data Flow

```
Request arrives
    ↓
Middleware parses UA
    ↓
Throttle uses UA data (bot detection, weighting)
    ↓
UA data attached to req.triva.throttle.uaData
    ↓
Log captures UA data
    ↓
UA data stored in log entry
```

## 📊 Output Format

```javascript
{
  ua: "Mozilla/5.0...",  // Raw user agent string
  browser: {
    name: "Chrome",
    version: "120.0.0.0",
    major: "120"
  },
  engine: {
    name: "Blink"
  },
  os: {
    name: "Windows",
    version: "10.0"
  },
  device: {
    type: "desktop",     // desktop, mobile, tablet
    model: null
  },
  cpu: {
    architecture: "amd64" // amd64, arm, x86
  },
  bot: {
    isBot: false,
    isAI: false,
    isCrawler: false,
    name: null,
    category: null       // ai-crawler, search, generic
  }
}
```

## 🤖 Bot Detection

The parser identifies several bot types:

### AI Crawlers
- **GPTBot** (OpenAI)
- **ClaudeBot** (Anthropic)
- **PerplexityBot**

### Search Engines
- **Googlebot**
- **Bingbot**

### Generic
- Any UA containing: bot, crawler, spider, curl, wget, python

### Bot Categories
- `ai-crawler` - AI model training crawlers
- `search` - Search engine bots
- `generic` - Other automated tools

## ⚖️ Throttle Weighting

Bots automatically receive higher throttle weights:

```javascript
// Regular user
weight = 1

// Regular bot (search engines, generic)
weight = 5

// AI bot (training data collection)
weight = 10
```

This means AI bots consume 10x more of the rate limit per request.

## 🎯 Accessing UA Data

### In Routes (from throttle)

```javascript
get('/my-route', (req, res) => {
  const uaData = req.triva?.throttle?.uaData;
  
  if (uaData) {
    console.log('Browser:', uaData.browser.name);
    console.log('Is Bot:', uaData.bot.isBot);
    console.log('OS:', uaData.os.name);
  }
  
  res.json({ uaData });
});
```

### In Logs

```javascript
import { log } from 'triva';

// Get logs with UA data
const logs = await log.get({ limit: 100 });

logs.forEach(entry => {
  console.log(entry.uaData.browser.name);
  console.log(entry.uaData.bot.isBot);
});
```

### Example: Block Bots

```javascript
get('/members-only', (req, res) => {
  const uaData = req.triva?.throttle?.uaData;
  
  if (uaData?.bot?.isBot) {
    res.statusCode = 403;
    return res.json({
      error: 'Bots not allowed',
      detected: uaData.bot.name
    });
  }
  
  res.json({ content: 'Members area' });
});
```

### Example: Bot Analytics

```javascript
get('/analytics', async (req, res) => {
  const logs = await log.get('all');
  
  const stats = {
    totalRequests: logs.length,
    bots: logs.filter(l => l.uaData?.bot?.isBot).length,
    aiBots: logs.filter(l => l.uaData?.bot?.isAI).length,
    browsers: {}
  };
  
  logs.forEach(log => {
    if (log.uaData?.browser?.name) {
      const browser = log.uaData.browser.name;
      stats.browsers[browser] = (stats.browsers[browser] || 0) + 1;
    }
  });
  
  res.json(stats);
});
```

## 🔍 Example UA Strings

### Chrome on Windows
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 
(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```
Result:
```javascript
{
  browser: { name: "Chrome", version: "120.0.0.0", major: "120" },
  engine: { name: "Blink" },
  os: { name: "Windows", version: "10.0" },
  device: { type: "desktop" },
  cpu: { architecture: "amd64" },
  bot: { isBot: false }
}
```

### Googlebot
```
Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)
```
Result:
```javascript
{
  browser: { name: null },
  bot: { 
    isBot: true, 
    isAI: false,
    isCrawler: true,
    name: "Googlebot",
    category: "search"
  }
}
```

### ClaudeBot (AI)
```
Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); 
compatible; ClaudeBot/1.0; +claudebot@anthropic.com
```
Result:
```javascript
{
  browser: { name: null },
  bot: { 
    isBot: true,
    isAI: true,
    isCrawler: true,
    name: "ClaudeBot",
    category: "ai-crawler"
  }
}
```

## 📈 Use Cases

### 1. Bot Protection
```javascript
// Block AI crawlers from expensive endpoints
get('/api/generate', (req, res) => {
  if (req.triva?.throttle?.uaData?.bot?.isAI) {
    res.statusCode = 403;
    return res.json({ error: 'AI crawlers not permitted' });
  }
  // ... expensive operation
});
```

### 2. Browser Statistics
```javascript
get('/stats/browsers', async (req, res) => {
  const logs = await log.get('all');
  const browsers = {};
  
  logs.forEach(log => {
    const browser = log.uaData?.browser?.name || 'Unknown';
    browsers[browser] = (browsers[browser] || 0) + 1;
  });
  
  res.json({ browsers });
});
```

### 3. Mobile Detection
```javascript
get('/content', (req, res) => {
  const device = req.triva?.throttle?.uaData?.device?.type;
  
  if (device === 'mobile') {
    return res.html(mobileLayout(content));
  }
  
  res.html(desktopLayout(content));
});
```

### 4. OS-Specific Features
```javascript
get('/download', (req, res) => {
  const os = req.triva?.throttle?.uaData?.os?.name;
  
  const downloadUrl = {
    'Windows': '/downloads/app-windows.exe',
    'macOS': '/downloads/app-macos.dmg',
    'Linux': '/downloads/app-linux.tar.gz'
  }[os] || '/downloads/app-generic.zip';
  
  res.redirect(downloadUrl);
});
```

## 🎓 Integration Details

### Middleware Enhancement

The throttle check now uses parsed UA data:

```javascript
// In middleware.js
const uaData = await parseUA(ua);

// Determine weight based on bot detection
let baseWeight = 1;
if (uaData.bot.isBot) {
  baseWeight = uaData.bot.isAI ? 10 : 5;
}

// Return UA data with throttle result
return { restricted: false, reason: "ok", uaData };
```

### Log Enhancement

Every log entry now includes UA data:

```javascript
// In log.js
class LogEntry {
  constructor(req) {
    // ... other fields
    this.uaData = req.triva?.throttle?.uaData || null;
  }
}

// Parse UA if not already available
async push(req) {
  const entry = new LogEntry(req);
  
  if (!entry.uaData && entry.userAgent !== 'unknown') {
    entry.uaData = await parseUA(entry.userAgent);
  }
  
  // ... save entry
}
```

## 🔧 Configuration

No configuration needed! UA parsing is automatic when:
- Throttling is enabled
- Logging is enabled

## ⚡ Performance

- **Parsing is fast** - Regex-based, <1ms per parse
- **Cached in throttle** - Parsed once, reused in logs
- **No external dependencies** - Pure JavaScript

## 📝 Summary

**What you get automatically:**
- ✅ Detailed browser/OS/device info
- ✅ Bot detection (AI, search, generic)
- ✅ Automatic throttle weighting for bots
- ✅ UA data in every log entry
- ✅ Access in routes via `req.triva`
- ✅ Analytics and filtering capabilities

**No setup required** - Just enable middleware and logging!

## 🚀 Try It

```bash
# Run the demo
node ua-parser-demo.js

# Test with different user agents
curl http://localhost:3000/ua-info
curl -A "Googlebot/2.1" http://localhost:3000/bot-check
curl http://localhost:3000/recent-logs
```

Your Triva server now has comprehensive user agent intelligence! 🎉
