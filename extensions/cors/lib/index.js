/**
 * @trivajs/cors
 * CORS middleware for Triva framework
 * 
 * Handles Cross-Origin Resource Sharing (CORS) with full configuration support
 */

/**
 * Default CORS configuration
 */
const defaults = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: [],
  exposedHeaders: [],
  credentials: false,
  maxAge: null,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Check if origin is allowed
 * @param {string} requestOrigin - Origin from request header
 * @param {string|string[]|RegExp|Function} allowedOrigin - Configured origin
 * @returns {boolean|string} - False if not allowed, origin string if allowed
 */
function isOriginAllowed(requestOrigin, allowedOrigin) {
  if (!requestOrigin) {
    return false;
  }

  // Allow all origins
  if (allowedOrigin === '*') {
    return '*';
  }

  // Array of origins
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(requestOrigin) ? requestOrigin : false;
  }

  // RegExp pattern
  if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(requestOrigin) ? requestOrigin : false;
  }

  // Function (dynamic check)
  if (typeof allowedOrigin === 'function') {
    return allowedOrigin(requestOrigin) ? requestOrigin : false;
  }

  // String (exact match)
  if (typeof allowedOrigin === 'string') {
    return allowedOrigin === requestOrigin ? requestOrigin : false;
  }

  return false;
}

/**
 * Configure CORS headers
 * @param {Object} config - CORS configuration
 * @returns {Function} - Triva middleware function
 */
export function cors(config = {}) {
  const options = { ...defaults, ...config };

  return function corsMiddleware(req, res, next) {
    const requestOrigin = req.headers.origin || req.headers.Origin;
    const requestMethod = req.method.toUpperCase();

    // Check if origin is allowed
    const allowedOrigin = isOriginAllowed(requestOrigin, options.origin);

    // Set Access-Control-Allow-Origin
    if (allowedOrigin) {
      if (allowedOrigin === '*' && !options.credentials) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else if (allowedOrigin !== '*') {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
      }
    }

    // Set Access-Control-Allow-Credentials
    if (options.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Set Access-Control-Expose-Headers
    if (options.exposedHeaders && options.exposedHeaders.length > 0) {
      res.setHeader(
        'Access-Control-Expose-Headers',
        options.exposedHeaders.join(', ')
      );
    }

    // Handle preflight request (OPTIONS)
    if (requestMethod === 'OPTIONS') {
      // Set Access-Control-Allow-Methods
      const methods = Array.isArray(options.methods) 
        ? options.methods.join(', ')
        : options.methods;
      res.setHeader('Access-Control-Allow-Methods', methods);

      // Set Access-Control-Allow-Headers
      let allowedHeaders = options.allowedHeaders;
      
      // If not specified, reflect the request headers
      if (!allowedHeaders || allowedHeaders.length === 0) {
        const requestHeaders = req.headers['access-control-request-headers'];
        if (requestHeaders) {
          allowedHeaders = requestHeaders;
          res.setHeader('Vary', 'Access-Control-Request-Headers');
        }
      }

      if (allowedHeaders) {
        const headers = Array.isArray(allowedHeaders)
          ? allowedHeaders.join(', ')
          : allowedHeaders;
        res.setHeader('Access-Control-Allow-Headers', headers);
      }

      // Set Access-Control-Max-Age
      if (options.maxAge !== null) {
        res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
      }

      // Handle preflight response
      if (!options.preflightContinue) {
        res.statusCode = options.optionsSuccessStatus;
        res.setHeader('Content-Length', '0');
        res.end();
        return;
      }
    }

    next();
  };
}

/**
 * Pre-configured CORS for development (allows all origins)
 */
export function corsDevMode() {
  return cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
    exposedHeaders: [],
    maxAge: 86400
  });
}

/**
 * Pre-configured strict CORS (specific origin only)
 * @param {string} origin - Allowed origin
 */
export function corsStrict(origin) {
  return cors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [],
    maxAge: 7200
  });
}

/**
 * Pre-configured CORS for multiple origins
 * @param {string[]} origins - Array of allowed origins
 */
export function corsMultiOrigin(origins) {
  return cors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600
  });
}

/**
 * Pre-configured CORS with dynamic origin validation
 * @param {Function} validator - Function that returns true/false for origin
 */
export function corsDynamic(validator) {
  return cors({
    origin: validator,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
  });
}

export default cors;
