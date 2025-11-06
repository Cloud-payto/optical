const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

/**
 * SECURITY MIDDLEWARE
 *
 * Protects the API from common attacks:
 * 1. Rate limiting - Prevents DoS and brute force attacks
 * 2. Input sanitization - Prevents NoSQL injection
 * 3. Helmet - Sets security headers
 * 4. Request validation - Validates UUIDs and inputs
 */

// ==============================================
// 1. RATE LIMITING
// ==============================================

/**
 * General API rate limiter
 * Applies to all /api/* routes except webhook
 * Limit: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests from counting toward limit (optional)
  skipSuccessfulRequests: false,
  // Skip failed requests from counting toward limit (optional)
  skipFailedRequests: false
});

/**
 * Webhook rate limiter (more permissive)
 * Webhooks need higher limits as they're automated
 * Limit: 1000 requests per hour per IP
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 emails per hour (very high volume)
  message: {
    error: 'Webhook rate limit exceeded',
    message: 'Too many webhook requests. Please check your email forwarding setup.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Authentication rate limiter (strict)
 * Prevents brute force attacks on login/signup
 * Limit: 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 failed attempts
  message: {
    error: 'Too many authentication attempts',
    message: 'Account locked. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Expensive operations rate limiter
 * For operations like parsing, enrichment, bulk operations
 * Limit: 20 requests per 5 minutes per IP
 */
const expensiveOpsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: {
    error: 'Rate limit exceeded for expensive operations',
    message: 'Please slow down. You can retry in 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ==============================================
// 2. INPUT SANITIZATION
// ==============================================

/**
 * Sanitize inputs to prevent NoSQL injection
 * Removes $ and . from user inputs
 */
const sanitizeInputs = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    // Log sanitization attempts in production
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[SECURITY] Sanitized input detected: ${key} from ${req.ip}`);
    }
  }
});

// ==============================================
// 3. HELMET - SECURITY HEADERS
// ==============================================

/**
 * Helmet sets various HTTP headers for security
 * Protects against XSS, clickjacking, etc.
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for now
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow CORS
});

// ==============================================
// 4. UUID VALIDATION
// ==============================================

/**
 * Validate UUID format for user IDs and resource IDs
 * Prevents SQL injection and malformed requests
 */
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Middleware to validate UUID parameters in routes
 * Usage: app.get('/api/users/:userId', validateUUIDParam('userId'), handler)
 */
function validateUUIDParam(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!value) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required parameter: ${paramName}`
      });
    }

    if (!validateUUID(value)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid UUID format for parameter: ${paramName}`,
        received: value
      });
    }

    next();
  };
}

// ==============================================
// 5. REQUEST LOGGING (PRODUCTION SAFE)
// ==============================================

/**
 * Log requests only in development, with sanitized output in production
 */
function requestLogger(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development: Log everything for debugging
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

    // Log body for non-GET requests (except sensitive routes)
    if (req.method !== 'GET' && !req.path.includes('/auth')) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
  } else {
    // Production: Log only essentials, no sensitive data
    const sensitiveRoutes = ['/auth', '/login', '/signup', '/password'];
    const isSensitive = sensitiveRoutes.some(route => req.path.includes(route));

    if (!isSensitive) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
    } else {
      // Just log the route, no details
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - [SENSITIVE]`);
    }
  }

  next();
}

// ==============================================
// 6. ERROR HANDLER (PRODUCTION SAFE)
// ==============================================

/**
 * Error handler that doesn't leak sensitive information in production
 */
function secureErrorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log full error for debugging (server-side only)
  console.error('[ERROR]', err.stack);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  if (isProduction) {
    // Production: Generic error messages, no stack traces
    res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
      message: statusCode >= 500
        ? 'Something went wrong. Please try again later.'
        : err.message || 'An error occurred processing your request.',
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown' // If you add request ID middleware
    });
  } else {
    // Development: Detailed error info for debugging
    res.status(statusCode).json({
      error: err.name || 'Error',
      message: err.message,
      stack: err.stack,
      details: err.details || null
    });
  }
}

// ==============================================
// 7. USER ID HASHING (for CloudMailin emails)
// ==============================================

const crypto = require('crypto');

/**
 * Hash user ID for CloudMailin forwarding emails
 * Makes it harder to guess other users' emails
 */
function hashUserId(userId) {
  const secret = process.env.USER_ID_SECRET || 'default-secret-change-me';
  return crypto
    .createHmac('sha256', secret)
    .update(userId)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for brevity
}

/**
 * Verify hashed user ID
 */
function verifyHashedUserId(hash, userId) {
  return hashUserId(userId) === hash;
}

/**
 * Generate CloudMailin forwarding email with hashed user ID
 */
function generateForwardingEmail(userId) {
  const hash = hashUserId(userId);
  const cloudmailinAddress = process.env.CLOUDMAILIN_ADDRESS || 'a48947dbd077295c13ea';
  return `${cloudmailinAddress}+${hash}@cloudmailin.net`;
}

/**
 * Extract user ID from CloudMailin email (with hashed format)
 * Falls back to direct UUID extraction for backwards compatibility
 */
function extractUserIdFromEmail(email) {
  // New format: cloudmailin+HASH@cloudmailin.net
  const hashMatch = email.match(/\+([a-f0-9]{16})@/i);
  if (hashMatch) {
    return { hash: hashMatch[1], requiresLookup: true };
  }

  // Old format (backwards compatibility): cloudmailin+UUID@cloudmailin.net
  const uuidMatch = email.match(/\+([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})@/i);
  if (uuidMatch) {
    return { userId: uuidMatch[1], requiresLookup: false };
  }

  return null;
}

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
  // Rate limiters
  apiLimiter,
  webhookLimiter,
  authLimiter,
  expensiveOpsLimiter,

  // Input sanitization
  sanitizeInputs,

  // Security headers
  helmetConfig,

  // Validation
  validateUUID,
  validateUUIDParam,

  // Logging
  requestLogger,

  // Error handling
  secureErrorHandler,

  // User ID hashing
  hashUserId,
  verifyHashedUserId,
  generateForwardingEmail,
  extractUserIdFromEmail
};
