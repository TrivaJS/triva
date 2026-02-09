<p align="center">

  <img src="https://assets.trivajs.com/header.jpg" >

</p>

# @trivajs/cli

Command-line interface for managing [Triva](https://github.com/TrivaJS) applications. Manage logs, errors, cache, and server directly from your terminal.

## Installation

```bash
npm install triva
npm install -g @trivajs/cli
```

Or use with npx:
```bash
npx @trivajs/cli logs list
```

## Quick Start

```bash
# View recent logs
triva logs list

# Check errors
triva errors list

# Cache operations
triva cache get user:123

# Server status
triva server status
```

## Features

✅ **Logs Management** - View, filter, export request logs
✅ **Error Tracking** - List, resolve, analyze errors
✅ **Cache Control** - Get, set, delete cache entries
✅ **Statistics** - View application metrics
✅ **Server Management** - Start, stop, restart server
✅ **Zero Dependencies** - Lightweight CLI tool

## Commands

### Logs

```bash
# List recent logs
triva logs list

# List with limit
triva logs list --limit 100

# Filter by time
triva logs list --since 24h

# Get specific log
triva logs get abc123

# Export to JSON
triva logs export --format json --output logs.json

# Export to CSV
triva logs export --format csv --output logs.csv

# Clear old logs
triva logs clear --since 7d

# Clear all logs (requires --force)
triva logs clear --force

# Filter logs
triva logs filter --method GET --status 200 --path /api
```

### Errors

```bash
# List unresolved errors
triva errors list

# List resolved errors
triva errors list --resolved true

# Filter by severity
triva errors list --severity error

# Get specific error
triva errors get abc123

# Resolve error
triva errors resolve abc123

# Clear resolved errors
triva errors clear --resolved

# Clear all errors (requires --force)
triva errors clear --force

# Show error statistics
triva errors stats
```

### Cache

```bash
# List all keys
triva cache list

# List with pattern
triva cache list --pattern "user:*"

# Get value
triva cache get user:123

# Set value
triva cache set user:123 '{"name":"John"}'

# Set with TTL (milliseconds)
triva cache set session:abc "data" --ttl 3600000

# Delete key
triva cache delete user:123

# Delete pattern
triva cache delete "users:*"

# Clear all cache (requires --force)
triva cache clear --force

# Show cache statistics
triva cache stats
```

### Stats

```bash
# Request statistics
triva stats requests

# Performance metrics
triva stats performance

# Health check
triva stats health
```

### Server

```bash
# Start server
triva server start

# Start in background (daemon)
triva server start --daemon

# Start custom entry file
triva server start --entry app.js

# Stop server
triva server stop

# Restart server
triva server restart

# Check status
triva server status
```

## Global Options

```bash
--config <path>      Path to config file (default: triva.config.js)
--format <type>      Output format: json, table, csv (default: table)
--limit <number>     Limit results (default: 50)
--output <file>      Save output to file
--severity <level>   Filter by severity: info, warn, error
--since <time>       Time filter: 1h, 24h, 7d, 30d
--force              Skip confirmation prompts
--help, -h           Show help
--version, -v        Show version
```

## Configuration

Create `triva.config.js` in your project root:

```javascript
export default {
  cache: {
    type: 'memory',
    retention: 3600000
  },
  throttle: {
    limit: 100,
    window_ms: 60000
  },
  retention: {
    enabled: true,
    maxEntries: 10000
  },
  errorTracking: {
    enabled: true,
    maxEntries: 5000
  }
};
```

Then use CLI:
```bash
triva logs list --config triva.config.js
```

## Examples

### Daily Log Export

```bash
# Export yesterday's logs
triva logs export --since 24h --output logs-$(date +%Y-%m-%d).json
```

### Error Monitoring

```bash
# Check for new errors
triva errors list --limit 10

# Resolve all errors in bulk (after fixing)
triva errors list --format json | jq -r '.[].id' | xargs -I {} triva errors resolve {}
```

### Cache Maintenance

```bash
# Clear old session data
triva cache delete "session:*"

# Check cache usage
triva cache stats

# Backup cache keys
triva cache list > cache-backup.txt
```

### Performance Monitoring

```bash
# Check slow endpoints
triva stats performance --limit 1000

# Monitor health
triva stats health
```

### Server Management

```bash
# Production deployment
triva server start --daemon --entry dist/server.js

# Quick restart after code changes
triva server restart

# Check if running
triva server status
```

## Output Formats

### Table (Default)

```bash
triva logs list
# id       | timestamp           | method | path      | status | duration
# abc123   | 2026-02-04 12:00:00 | GET    | /api/data | 200    | 45ms
```

### JSON

```bash
triva logs list --format json
# [
#   {
#     "id": "abc123",
#     "timestamp": "2026-02-04T12:00:00.000Z",
#     "method": "GET",
#     "pathname": "/api/data",
#     "statusCode": 200,
#     "responseTime": 45
#   }
# ]
```

### CSV

```bash
triva logs list --format csv
# id,timestamp,method,pathname,statusCode,responseTime
# abc123,2026-02-04T12:00:00.000Z,GET,/api/data,200,45
```

## Scripting

Use in shell scripts:

```bash
#!/bin/bash

# Check for errors
ERROR_COUNT=$(triva errors list --format json | jq length)

if [ $ERROR_COUNT -gt 10 ]; then
  echo "Too many errors: $ERROR_COUNT"
  # Send alert
  curl -X POST https://alerts.example.com/webhook
fi

# Export logs daily
triva logs export --since 24h --output "logs-$(date +%Y-%m-%d).json"

# Clear old logs
triva logs clear --since 30d --force
```

## Programmatic Usage

Use CLI commands from Node.js:

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get logs as JSON
const { stdout } = await execAsync('triva logs list --format json');
const logs = JSON.parse(stdout);

console.log(`Found ${logs.length} logs`);
```

## Troubleshooting

### Command not found

Install globally:
```bash
npm install -g @trivajs/cli
```

Or use npx:
```bash
npx @trivajs/cli logs list
```

### Config file not found

Specify config path:
```bash
triva logs list --config ./config/triva.config.js
```

### Permission denied

Make binary executable:
```bash
chmod +x node_modules/@trivajs/cli/bin/triva.js
```

### Server won't start

Check if port is in use:
```bash
triva server status
```

## Development

```bash
# Clone repository
git clone https://github.com/yourusername/triva.git
cd triva/extensions/cli

# Install dependencies
npm install

# Test CLI
node bin/triva.js logs list
```

## License

MIT License - see LICENSE file

## Contributing

Issues and PRs welcome! See main [Triva repository](https://github.com/TrivaJS/triva) for contribution guidelines.

## Related

- [Triva Framework](https://github.com/TrivaJS/triva) - Main framework
- [@trivajs/cors](https://npmjs.com/package/@trivajs/cors) - CORS middleware
