# HTTPS Support in Triva

Triva supports both HTTP and HTTPS servers with identical features and APIs. Choose the protocol that fits your deployment needs.

## Quick Start

### HTTP Server (Default)

```javascript
import { build, get, listen } from 'triva';

await build({
  cache: { type: 'memory' }
});

get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

listen(3000);
```

### HTTPS Server

```javascript
import { build, get, listen } from 'triva';
import fs from 'fs';

await build({
  protocol: 'https',
  ssl: {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem')
  },
  cache: { type: 'memory' }
});

get('/', (req, res) => {
  res.json({ message: 'Secure Hello World' });
});

listen(3443); // Standard HTTPS port is 443
```

## Configuration

### Protocol Option

```javascript
await build({
  protocol: 'http',   // or 'https'
  // ... other options
});
```

| Value | Description |
|-------|-------------|
| `'http'` | Standard HTTP server (default) |
| `'https'` | Secure HTTPS server |

### SSL Configuration

When using `protocol: 'https'`, you must provide SSL certificates:

```javascript
await build({
  protocol: 'https',
  ssl: {
    key: Buffer | string,      // Private key (required)
    cert: Buffer | string,      // Certificate (required)
    ca: Buffer | string,        // Certificate Authority (optional)
    passphrase: string,         // Key passphrase (optional)
    options: {                  // Additional Node.js https options
      // See: https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
    }
  }
});
```

### Complete Example

```javascript
import { build, get, post, listen } from 'triva';
import fs from 'fs';

await build({
  env: 'production',
  protocol: 'https',
  
  ssl: {
    key: fs.readFileSync('/etc/ssl/private/server-key.pem'),
    cert: fs.readFileSync('/etc/ssl/certs/server-cert.pem'),
    ca: fs.readFileSync('/etc/ssl/certs/ca-bundle.pem'),
    passphrase: process.env.SSL_PASSPHRASE
  },
  
  cache: {
    type: 'redis',
    retention: 3600000,
    database: {
      host: 'localhost',
      port: 6379
    }
  },
  
  throttle: {
    limit: 100,
    window_ms: 60000
  },
  
  retention: {
    enabled: true,
    maxEntries: 100000
  }
});

get('/api/users', (req, res) => {
  res.json({ users: [] });
});

post('/api/users', async (req, res) => {
  const user = await req.json();
  res.status(201).json({ created: user });
});

listen(443);
```

## Feature Parity

All Triva features work identically with both HTTP and HTTPS:

| Feature | HTTP | HTTPS |
|---------|------|-------|
| Routing | ✅ | ✅ |
| Middleware | ✅ | ✅ |
| Caching | ✅ | ✅ |
| Throttling | ✅ | ✅ |
| Logging | ✅ | ✅ |
| Error Tracking | ✅ | ✅ |
| Cookie Parsing | ✅ | ✅ |
| CORS | ✅ | ✅ |
| All Extensions | ✅ | ✅ |

## Development Certificates

### Generate Self-Signed Certificates

For development and testing, generate self-signed certificates:

```bash
# Using the included script
npm run generate-certs

# Or manually with OpenSSL
openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -days 365
```

### Using Development Certificates

```javascript
import fs from 'fs';

await build({
  protocol: 'https',
  ssl: {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost-cert.pem')
  }
});

listen(3443);
```

**Note:** Browsers will show a security warning for self-signed certificates. This is normal for development.

## Production Certificates

### Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

```javascript
await build({
  protocol: 'https',
  ssl: {
    key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
  }
});
```

### Commercial Certificate

```javascript
await build({
  protocol: 'https',
  ssl: {
    key: fs.readFileSync('/path/to/commercial-key.pem'),
    cert: fs.readFileSync('/path/to/commercial-cert.pem'),
    ca: fs.readFileSync('/path/to/ca-bundle.pem') // Often required
  }
});
```

## Running Both HTTP and HTTPS

You can run HTTP and HTTPS servers simultaneously:

```javascript
// HTTP Server
const httpServer = await build({ protocol: 'http' });
httpServer.get('/', (req, res) => {
  res.redirect('https://example.com' + req.url, 301);
});
httpServer.listen(80);

// HTTPS Server
const httpsServer = await build({
  protocol: 'https',
  ssl: { key, cert }
});
httpsServer.get('/', (req, res) => {
  res.json({ secure: true });
});
httpsServer.listen(443);
```

## HTTP to HTTPS Redirect

Common pattern for forcing HTTPS:

```javascript
import { build, get } from 'triva';

// HTTP server that redirects to HTTPS
const http = await build({ protocol: 'http' });

http.use((req, res, next) => {
  const host = req.headers.host.split(':')[0];
  const secureUrl = `https://${host}${req.url}`;
  res.redirect(secureUrl, 301);
});

http.listen(80);

// HTTPS server with actual application
const https = await build({
  protocol: 'https',
  ssl: { key, cert }
});

https.get('/', (req, res) => {
  res.json({ message: 'Secure content' });
});

https.listen(443);
```

## Environment-Based Configuration

```javascript
const config = {
  protocol: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  cache: { type: 'memory' }
};

if (config.protocol === 'https') {
  config.ssl = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
}

await build(config);
```

## Error Handling

### Missing Certificates

```javascript
try {
  await build({
    protocol: 'https',
    ssl: {
      key: fs.readFileSync('./missing-key.pem'),
      cert: fs.readFileSync('./missing-cert.pem')
    }
  });
} catch (err) {
  console.error('Failed to start HTTPS server:', err.message);
  // Fallback to HTTP or exit
}
```

### Invalid Certificates

```javascript
await build({
  protocol: 'https',
  ssl: {
    key: Buffer.from('invalid'),
    cert: Buffer.from('invalid')
  }
});
// Throws: Error with certificate validation details
```

## Best Practices

### 1. Never Commit Certificates

Add to `.gitignore`:
```
*.pem
*.key
*.crt
*.cert
certs/
ssl/
```

### 2. Use Environment Variables

```javascript
await build({
  protocol: 'https',
  ssl: {
    key: process.env.SSL_KEY,     // Base64 encoded
    cert: process.env.SSL_CERT,   // Base64 encoded
    passphrase: process.env.SSL_PASSPHRASE
  }
});
```

### 3. Certificate Rotation

```javascript
// Watch for certificate changes
import { watch } from 'fs';

watch('/path/to/cert.pem', () => {
  console.log('Certificate updated, reloading...');
  // Reload certificates
});
```

### 4. Secure Headers

```javascript
import { build, use } from 'triva';

await build({ protocol: 'https', ssl: { key, cert } });

use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

## Troubleshooting

### "HTTPS requires ssl.key and ssl.cert"

**Cause:** Missing SSL configuration  
**Solution:** Provide `ssl.key` and `ssl.cert` in build options

### "EADDRINUSE: address already in use"

**Cause:** Port 443 already in use  
**Solution:** Use different port or stop other service

```javascript
// Use non-standard port for development
listen(3443); // Instead of 443
```

### Browser Shows "Not Secure"

**Cause:** Self-signed certificate  
**Solution:** Normal for development. Use valid certificate for production.

### "Certificate has expired"

**Cause:** Certificate past expiration date  
**Solution:** Renew certificate

```bash
# Let's Encrypt
sudo certbot renew
```

## Examples

See `examples/` directory:
- `http-server.js` - Standard HTTP server
- `https-server.js` - HTTPS server
- `dual-mode.js` - Run both HTTP and HTTPS

## Additional Resources

- [Node.js HTTPS Documentation](https://nodejs.org/api/https.html)
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
