# @triva/jwt

JWT authentication extension for Triva.

[![npm version](https://img.shields.io/npm/v/@triva/jwt.svg)](https://npmjs.com/package/@triva/jwt)
[![License](https://img.shields.io/npm/l/@triva/jwt.svg)](LICENSE)

## Features

✅ **Pure Node.js** - No dependencies, built with crypto module  
✅ **Standards Compliant** - Follows JWT RFC 7519  
✅ **Multiple Algorithms** - HS256, HS384, HS512  
✅ **Route Protection** - Easy middleware for protected routes  
✅ **Role-Based Access** - Built-in RBAC support  
✅ **Permission System** - Granular permission checking  
✅ **Token Refresh** - Automatic token refresh middleware  

## Installation

```bash
npm install @triva/jwt
```

## Quick Start

```javascript
import { build, post, get } from 'triva';
import { sign, protect, requireRole } from '@triva/jwt';

await build({ cache: { type: 'memory' } });

// Login endpoint
post('/auth/login', async (req, res) => {
  const { email, password } = await req.json();
  
  // Verify credentials (your logic)
  const user = await verifyCredentials(email, password);
  
  // Create JWT token
  const token = sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ token });
});

// Protected route
get('/api/profile', protect(), (req, res) => {
  res.json({ user: req.user });
});

// Admin only route
get('/api/admin', protect(), requireRole('admin'), (req, res) => {
  res.json({ admin: true });
});
```

## API

### sign(payload, secret, options)

Create a JWT token.

**Parameters:**
- `payload` (object) - Data to encode in the token
- `secret` (string) - Secret key for signing
- `options` (object, optional)
  - `expiresIn` (string) - Expiration time: '60s', '15m', '24h', '7d'
  - `algorithm` (string) - Signing algorithm (default: 'HS256')

**Returns:** `string` - JWT token

**Example:**
```javascript
import { sign } from '@triva/jwt';

const token = sign(
  { userId: 123, role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

### verify(token, secret)

Verify and decode a JWT token.

**Parameters:**
- `token` (string) - JWT token to verify
- `secret` (string) - Secret key used for signing

**Returns:** `object` - Decoded payload

**Throws:** `Error` if token is invalid or expired

**Example:**
```javascript
import { verify } from '@triva/jwt';

try {
  const payload = verify(token, process.env.JWT_SECRET);
  console.log(payload.userId);  // 123
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

### decode(token)

Decode token without verification.

**Warning:** Does not verify signature. Use only when you trust the source.

**Parameters:**
- `token` (string) - JWT token

**Returns:** `object` - Decoded payload

**Example:**
```javascript
import { decode } from '@triva/jwt';

const payload = decode(token);
console.log(payload);
```

### protect(options)

Middleware to protect routes with JWT authentication.

**Parameters:**
- `options` (object, optional)
  - `secret` (string) - JWT secret (default: `process.env.JWT_SECRET`)
  - `getToken` (function) - Custom token extraction function
  - `required` (boolean) - Require authentication (default: true)

**Returns:** `function` - Middleware function

**Example:**
```javascript
import { get } from 'triva';
import { protect } from '@triva/jwt';

// Basic protection
get('/protected', protect(), (req, res) => {
  // req.user contains decoded token
  // req.token contains the original token
  res.json({ user: req.user });
});

// Custom token extraction
get('/custom', protect({
  getToken: (req) => req.query.token
}), (req, res) => {
  res.json({ user: req.user });
});

// Optional authentication
get('/optional', protect({ required: false }), (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ guest: true });
  }
});
```

### requireRole(...roles)

Middleware to require specific roles.

**Parameters:**
- `roles` (...string) - Required roles

**Returns:** `function` - Middleware function

**Example:**
```javascript
import { get } from 'triva';
import { protect, requireRole } from '@triva/jwt';

// Single role
get('/admin', 
  protect(), 
  requireRole('admin'), 
  (req, res) => {
    res.json({ admin: true });
  }
);

// Multiple roles (OR logic)
get('/moderator', 
  protect(), 
  requireRole('admin', 'moderator'), 
  (req, res) => {
    res.json({ moderator: true });
  }
);
```

### requirePermission(...permissions)

Middleware to require specific permissions.

**Parameters:**
- `permissions` (...string) - Required permissions

**Returns:** `function` - Middleware function

**Example:**
```javascript
import { get } from 'triva';
import { protect, requirePermission } from '@triva/jwt';

// User must have 'posts:delete' permission
get('/posts/:id/delete', 
  protect(), 
  requirePermission('posts:delete'), 
  (req, res) => {
    res.status(204).send();
  }
);

// Multiple permissions (AND logic)
get('/admin/settings', 
  protect(), 
  requirePermission('admin:read', 'admin:write'), 
  (req, res) => {
    res.json({ settings: {} });
  }
);
```

### refreshToken(options)

Middleware to automatically refresh tokens.

**Parameters:**
- `options` (object, optional)
  - `secret` (string) - JWT secret
  - `onRefresh` (function) - Callback when token refreshed

**Returns:** `function` - Middleware function

**Example:**
```javascript
import { get, use } from 'triva';
import { protect, refreshToken } from '@triva/jwt';

// Apply globally
use(protect());
use(refreshToken({
  onRefresh: async (req, newToken) => {
    console.log('Token refreshed for user:', req.user.userId);
  }
}));

// New token sent in X-New-Token header
get('/api/data', (req, res) => {
  res.json({ data: [] });
  // Response includes: X-New-Token: <new-jwt>
});
```

## Complete Examples

### Basic Authentication System

```javascript
import { build, post, get, use } from 'triva';
import { sign, protect } from '@triva/jwt';
import bcrypt from 'bcrypt';

await build({ cache: { type: 'memory' } });

// Register
post('/auth/register', async (req, res) => {
  const { email, password, name } = await req.json();
  
  // Hash password
  const hash = await bcrypt.hash(password, 10);
  
  // Save user (your database logic)
  const user = await db.users.create({ email, password: hash, name });
  
  // Create token
  const token = sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({ token, user: { id: user.id, email, name } });
});

// Login
post('/auth/login', async (req, res) => {
  const { email, password } = await req.json();
  
  // Find user
  const user = await db.users.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create token
  const token = sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token });
});

// Get current user
get('/auth/me', protect(), async (req, res) => {
  const user = await db.users.findById(req.user.userId);
  res.json({ user });
});
```

### Role-Based Access Control

```javascript
import { get, post, del } from 'triva';
import { protect, requireRole } from '@triva/jwt';

// Public route - no auth
get('/posts', (req, res) => {
  res.json({ posts: [] });
});

// User route - requires authentication
get('/posts/:id', protect(), (req, res) => {
  res.json({ post: {} });
});

// Author route - requires 'author' or 'admin' role
post('/posts', protect(), requireRole('author', 'admin'), (req, res) => {
  res.status(201).json({ post: {} });
});

// Admin route - requires 'admin' role
del('/posts/:id', protect(), requireRole('admin'), (req, res) => {
  res.status(204).send();
});
```

### Permission-Based Access

```javascript
import { get, post, put, del } from 'triva';
import { protect, requirePermission } from '@triva/jwt';

// Create token with permissions
const token = sign({
  userId: 123,
  permissions: ['posts:read', 'posts:create', 'posts:update']
}, secret);

// Routes with permission checks
get('/posts', 
  protect(), 
  requirePermission('posts:read'), 
  (req, res) => {
    res.json({ posts: [] });
  }
);

post('/posts', 
  protect(), 
  requirePermission('posts:create'), 
  (req, res) => {
    res.status(201).json({ post: {} });
  }
);

put('/posts/:id', 
  protect(), 
  requirePermission('posts:update'), 
  (req, res) => {
    res.json({ post: {} });
  }
);

del('/posts/:id', 
  protect(), 
  requirePermission('posts:delete'),  // User doesn't have this
  (req, res) => {
    res.status(204).send();  // Won't reach here
  }
);
```

## Error Handling

The extension provides detailed error codes:

```javascript
{
  error: "Error message",
  code: "ERROR_CODE"
}
```

**Error Codes:**
- `NO_TOKEN` - No token provided
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_TOKEN` - Token signature invalid
- `NOT_AUTHENTICATED` - Authentication required
- `FORBIDDEN` - Insufficient permissions

**Handle errors:**
```javascript
get('/protected', protect(), (req, res) => {
  res.json({ user: req.user });
});

// Client receives on error:
// 401: { error: "No token provided", code: "NO_TOKEN" }
// 401: { error: "Token expired", code: "TOKEN_EXPIRED" }
// 401: { error: "Invalid token", code: "INVALID_TOKEN" }
```

## Security Best Practices

### 1. Use Strong Secrets

```javascript
// ✅ Good - Random 256-bit secret
const secret = crypto.randomBytes(32).toString('hex');

// ❌ Bad - Weak secret
const secret = 'my-secret-key';
```

### 2. Set Appropriate Expiration

```javascript
// ✅ Good - Short-lived tokens
sign(payload, secret, { expiresIn: '15m' });

// ❌ Bad - Long-lived tokens
sign(payload, secret, { expiresIn: '365d' });
```

### 3. Use HTTPS

Always use HTTPS in production to prevent token interception.

### 4. Store Tokens Securely

```javascript
// ✅ Good - httpOnly cookies (server-side)
res.cookie('token', token, { httpOnly: true, secure: true });

// ⚠️ Acceptable - localStorage (client-side)
localStorage.setItem('token', token);

// ❌ Bad - Plain cookies
document.cookie = `token=${token}`;
```

### 5. Validate Payload

```javascript
get('/protected', protect(), (req, res) => {
  // Validate user still exists
  const user = await db.users.findById(req.user.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  res.json({ user });
});
```

## Testing

```javascript
import assert from 'assert';
import { sign, verify } from '@triva/jwt';

const secret = 'test-secret';

// Test sign
const token = sign({ userId: 123 }, secret, { expiresIn: '1h' });
assert.ok(token);

// Test verify
const payload = verify(token, secret);
assert.equal(payload.userId, 123);

// Test expiration
const expiredToken = sign({ userId: 123 }, secret, { expiresIn: '0s' });
await new Promise(resolve => setTimeout(resolve, 1000));
assert.throws(() => verify(expiredToken, secret), /Token expired/);
```

## License

MIT © Triva Team
