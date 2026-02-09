# Embedded Database (Encrypted JSON)

Triva's Embedded database adapter stores data in an encrypted JSON file on disk. Perfect for small applications that need persistence without external databases.

## Features

- ✅ **Built-in** - No external dependencies
- 🔒 **Encrypted** - AES-256-CBC encryption
- 📁 **File-based** - Single `.db` file
- ⚡ **Fast** - In-memory with periodic persistence
- 🔑 **Configurable Key** - Set your own encryption key

## Installation

No installation needed - built into Triva!

## Configuration

```javascript
import { build } from 'triva';

await build({
  cache: {
    type: 'embedded',
    database: {
      filename: './my-cache.db',        // Optional (default: './triva.db')
      encryptionKey: 'your-secret-key'  // Optional (unencrypted if not provided)
    }
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filename` | string | `'./triva.db'` | Path to database file |
| `encryptionKey` | string | `null` | Encryption key (if not provided, data is unencrypted) |

## Usage

### Basic Example

```javascript
import { build, get, listen } from 'triva';

await build({
  cache: {
    type: 'embedded',
    database: {
      filename: './cache.db',
      encryptionKey: process.env.DB_KEY || 'change-me-in-production'
    }
  }
});

get('/api/data', (req, res) => {
  res.json({ data: 'This will be cached in encrypted file' });
});

listen(3000);
```

### With Environment Variables

```javascript
await build({
  cache: {
    type: 'embedded',
    database: {
      filename: process.env.DB_PATH || './cache.db',
      encryptionKey: process.env.DB_ENCRYPTION_KEY
    }
  }
});
```

**.env file:**
```
DB_PATH=./production-cache.db
DB_ENCRYPTION_KEY=super-secret-key-32-characters-long
```

### Without Encryption

```javascript
await build({
  cache: {
    type: 'embedded',
    database: {
      filename: './cache.db'
      // No encryptionKey = unencrypted JSON
    }
  }
});
```

## Encryption

### Algorithm

- **Cipher**: AES-256-CBC
- **Key Derivation**: scrypt
- **IV**: Random 16 bytes per encryption

### Key Requirements

- **Recommended**: 32+ characters
- **Format**: String
- **Storage**: Environment variable (never commit to code)

### Security Best Practices

1. **Use environment variables:**
   ```javascript
   encryptionKey: process.env.DB_ENCRYPTION_KEY
   ```

2. **Generate strong keys:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Rotate keys periodically:**
   - Export data
   - Change key
   - Re-import data

4. **Never commit keys to Git:**
   ```gitignore
   .env
   *.db
   ```

## File Format

### Encrypted File

```
a1b2c3d4e5f6...:9f8e7d6c5b4a3...
[IV (hex)]:[Encrypted Data (hex)]
```

### Unencrypted File

```json
{
  "user:123": {
    "value": { "name": "Alice" },
    "expiresAt": 1640000000000
  },
  "session:abc": {
    "value": "token",
    "expiresAt": null
  }
}
```

## Performance

### Benchmarks

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Get | ~0.1ms | ~10,000 ops/sec |
| Set | ~5-10ms | ~100-200 ops/sec |
| Delete | ~5-10ms | ~100-200 ops/sec |

*Note: Set/Delete are slower due to file writes*

### Optimization Tips

1. **Use TTL wisely** - Let expired entries accumulate, clear periodically
2. **Batch operations** - Group multiple sets together
3. **Async operations** - Non-blocking file I/O

## Comparison with Other Adapters

| Feature | Embedded | SQLite | Redis | MongoDB |
|---------|----------|--------|-------|---------|
| Setup | None | Medium | Medium | Medium |
| External Deps | ❌ | ✅ | ✅ | ✅ |
| Encryption | ✅ Built-in | ❌ Manual | ❌ Manual | ✅ Available |
| Performance | Fast | Fast | Fastest | Fast |
| File Size | Small | Small | N/A | Large |
| Querying | Limited | SQL | Keys | Rich |

## When to Use

### ✅ Good for:
- Small applications
- Development/testing
- Single-server deployments
- Sensitive data (with encryption)
- Simple caching needs

### ❌ Not good for:
- High-traffic applications
- Multi-server deployments
- Complex queries
- Large datasets (>100MB)

## Limitations

1. **Single file** - All data in one file
2. **Memory-based** - Entire dataset loaded in memory
3. **File locking** - Not suitable for multiple processes
4. **No transactions** - Atomic operations only
5. **No indexes** - Linear search for patterns

## Troubleshooting

### "Failed to persist database"

**Cause:** Write permission error  
**Fix:** Ensure write permissions on directory

```bash
chmod 755 ./
```

### "Decryption failed"

**Cause:** Wrong encryption key  
**Fix:** Use correct key or delete database file

### Large file size

**Cause:** Many expired entries  
**Fix:** Clear expired entries:

```javascript
import { cache } from 'triva';

// Clear all expired
await cache.keys('*').then(async keys => {
  for (const key of keys) {
    await cache.get(key); // Triggers expiration check
  }
});
```

## Migration

### From Memory to Embedded

```javascript
// Before
cache: {
  type: 'memory'
}

// After
cache: {
  type: 'embedded',
  database: {
    filename: './cache.db',
    encryptionKey: process.env.DB_KEY
  }
}
```

Data is automatically persisted on disk.

### From Embedded to SQLite

```javascript
// Export data
import { cache } from 'triva';
const data = {};
const keys = await cache.keys('*');
for (const key of keys) {
  data[key] = await cache.get(key);
}
await fs.writeFile('backup.json', JSON.stringify(data));

// Switch to SQLite
cache: {
  type: 'sqlite',
  database: {
    filename: './cache.sqlite'
  }
}

// Import data
const backup = JSON.parse(await fs.readFile('backup.json'));
for (const [key, value] of Object.entries(backup)) {
  await cache.set(key, value);
}
```

## Examples

See `examples/embedded-db.js` for a complete working example.

## Additional Resources

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [AES Encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [scrypt Key Derivation](https://nodejs.org/api/crypto.html#crypto_crypto_scrypt_password_salt_keylen_options_callback)
