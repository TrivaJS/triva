/*
 * Copyright 2026 Kris Powers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */

'use strict';

/* ---------------- Cookie Parsing ---------------- */
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  const cookies = {};

  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    const key = parts[0];
    const value = parts.slice(1).join('='); // Handle values with '=' in them

    if (key) {
      try {
        // Decode URI components
        cookies[key] = decodeURIComponent(value);
      } catch (e) {
        // If decode fails, use raw value
        cookies[key] = value;
      }
    }
  });

  return cookies;
}

/* ---------------- Cookie Serialization ---------------- */
function serializeCookie(name, value, options = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  if (options.expires) {
    const expires = options.expires instanceof Date
      ? options.expires.toUTCString()
      : new Date(options.expires).toUTCString();
    cookie += `; Expires=${expires}`;
  }

  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }

  if (options.path) {
    cookie += `; Path=${options.path}`;
  } else {
    cookie += `; Path=/`;
  }

  if (options.secure) {
    cookie += `; Secure`;
  }

  if (options.httpOnly) {
    cookie += `; HttpOnly`;
  }

  if (options.sameSite) {
    const sameSite = typeof options.sameSite === 'string'
      ? options.sameSite
      : (options.sameSite === true ? 'Strict' : 'Lax');
    cookie += `; SameSite=${sameSite}`;
  }

  return cookie;
}

/* ---------------- Cookie Parser Middleware ---------------- */
function cookieParser(secret) {
  return (req, res, next) => {
    // Parse cookies from request
    const cookieHeader = req.headers.cookie;
    req.cookies = parseCookies(cookieHeader);

    // Add cookie helper methods to response
    res.cookie = (name, value, options = {}) => {
      const cookie = serializeCookie(name, value, options);

      // Handle multiple Set-Cookie headers
      const existing = res.getHeader('Set-Cookie');
      if (existing) {
        const cookies = Array.isArray(existing) ? existing : [existing];
        cookies.push(cookie);
        res.setHeader('Set-Cookie', cookies);
      } else {
        res.setHeader('Set-Cookie', cookie);
      }

      return res;
    };

    res.clearCookie = (name, options = {}) => {
      const clearOptions = {
        ...options,
        expires: new Date(0),
        maxAge: -1
      };
      return res.cookie(name, '', clearOptions);
    };

    next();
  };
}

export { parseCookies, serializeCookie, cookieParser };
