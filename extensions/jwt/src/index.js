/**
 * @triva/jwt - JWT Authentication Extension
 * 
 * Provides JWT token generation, verification, and route protection
 * for Triva applications.
 */

import crypto from 'crypto';

/**
 * JWT Header and Payload encoder/decoder
 */
class JWT {
  /**
   * Create JWT token
   * @param {Object} payload - Data to encode
   * @param {string} secret - Secret key for signing
   * @param {Object} options - Token options
   * @param {string} options.expiresIn - Expiration time (e.g., '24h', '7d')
   * @param {string} options.algorithm - Signing algorithm (default: 'HS256')
   * @returns {string} JWT token
   */
  static sign(payload, secret, options = {}) {
    if (!secret || typeof secret !== 'string') {
      throw new TypeError('Secret must be a non-empty string');
    }

    const {
      expiresIn,
      algorithm = 'HS256'
    } = options;

    // Create header
    const header = {
      alg: algorithm,
      typ: 'JWT'
    };

    // Create payload with standard claims
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      ...payload,
      iat: now
    };

    // Add expiration if specified
    if (expiresIn) {
      claims.exp = now + this.parseExpiration(expiresIn);
    }

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(claims));

    // Create signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = this.createSignature(signatureInput, secret, algorithm);

    return `${signatureInput}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @param {string} secret - Secret key for verification
   * @returns {Object} Decoded payload
   * @throws {Error} If token is invalid or expired
   */
  static verify(token, secret) {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    if (!secret || typeof secret !== 'string') {
      throw new Error('Secret must be a non-empty string');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const header = JSON.parse(this.base64UrlDecode(encodedHeader));
    const expectedSignature = this.createSignature(signatureInput, secret, header.alg);

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * Decode token without verification (use with caution)
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  static decode(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    return JSON.parse(this.base64UrlDecode(parts[1]));
  }

  /**
   * Parse expiration string to seconds
   * @private
   */
  static parseExpiration(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiresIn format. Use: 60s, 15m, 24h, 7d');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60
    };

    return value * multipliers[unit];
  }

  /**
   * Base64 URL encode
   * @private
   */
  static base64UrlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   * @private
   */
  static base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString('utf8');
  }

  /**
   * Create HMAC signature
   * @private
   */
  static createSignature(input, secret, algorithm) {
    const hmacAlgorithm = algorithm === 'HS256' ? 'sha256' :
                          algorithm === 'HS384' ? 'sha384' :
                          algorithm === 'HS512' ? 'sha512' : 'sha256';

    const hmac = crypto.createHmac(hmacAlgorithm, secret);
    hmac.update(input);
    return this.base64UrlEncode(hmac.digest('base64'));
  }
}

/**
 * Middleware to protect routes with JWT authentication
 * @param {Object} options - Protection options
 * @param {string} options.secret - JWT secret (default: process.env.JWT_SECRET)
 * @param {Function} options.getToken - Custom token extraction function
 * @param {boolean} options.required - Require authentication (default: true)
 * @returns {Function} Middleware function
 */
export function protect(options = {}) {
  const {
    secret = process.env.JWT_SECRET,
    getToken,
    required = true
  } = options;

  if (!secret) {
    throw new Error('JWT secret is required. Set JWT_SECRET env var or pass secret option.');
  }

  return (req, res, next) => {
    try {
      // Extract token
      let token;
      
      if (getToken) {
        token = getToken(req);
      } else {
        // Default: Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      // No token provided
      if (!token) {
        if (required) {
          return res.status(401).json({ 
            error: 'No token provided',
            code: 'NO_TOKEN'
          });
        }
        return next();
      }

      // Verify token
      const payload = JWT.verify(token, secret);
      req.user = payload;
      req.token = token;

      next();
    } catch (error) {
      if (error.message === 'Token expired') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: error.message
      });
    }
  };
}

/**
 * Middleware to require specific roles
 * @param {...string} roles - Required roles
 * @returns {Function} Middleware function
 */
export function requireRole(...roles) {
  if (roles.length === 0) {
    throw new Error('At least one role must be specified');
  }

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Check if user has required role
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: roles,
        current: userRole
      });
    }

    next();
  };
}

/**
 * Middleware to require specific permissions
 * @param {...string} permissions - Required permissions
 * @returns {Function} Middleware function
 */
export function requirePermission(...permissions) {
  if (permissions.length === 0) {
    throw new Error('At least one permission must be specified');
  }

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Check if user has required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permissions,
        current: userPermissions
      });
    }

    next();
  };
}

/**
 * Create refresh token middleware
 * @param {Object} options - Refresh options
 * @param {string} options.secret - JWT secret
 * @param {Function} options.onRefresh - Callback when token refreshed
 * @returns {Function} Middleware function
 */
export function refreshToken(options = {}) {
  const {
    secret = process.env.JWT_SECRET,
    onRefresh
  } = options;

  return async (req, res, next) => {
    try {
      const payload = JWT.verify(req.token, secret);
      
      // Create new token
      const { iat, exp, ...claims } = payload;
      const newToken = JWT.sign(claims, secret, { expiresIn: '24h' });

      // Call callback if provided
      if (onRefresh) {
        await onRefresh(req, newToken);
      }

      // Add new token to response
      res.header('X-New-Token', newToken);
      
      next();
    } catch (error) {
      next();
    }
  };
}

// Export JWT class
export { JWT };

// Named exports for convenience
export const sign = JWT.sign.bind(JWT);
export const verify = JWT.verify.bind(JWT);
export const decode = JWT.decode.bind(JWT);

// Default export
export default {
  JWT,
  sign,
  verify,
  decode,
  protect,
  requireRole,
  requirePermission,
  refreshToken
};
