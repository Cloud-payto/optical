# Security Implementation Guide

## Overview

Opti-Profit implements multiple layers of security to protect against common web vulnerabilities and ensure safe operation in production.

---

## 🛡️ Security Features Implemented

### 1. **Rate Limiting** ✅

Protects against DoS attacks and abuse by limiting requests per IP address.

#### Rate Limits by Route Type:

| Route Type | Limit | Window | Use Case |
|------------|-------|--------|----------|
| **General API** | 100 requests | 15 minutes | `/api/inventory`, `/api/orders`, etc. |
| **Webhook** | 1000 requests | 1 hour | `/api/webhook` (high volume) |
| **Authentication** | 5 requests | 15 minutes | Login/signup (brute force protection) |
| **Expensive Ops** | 20 requests | 5 minutes | `/api/parse`, `/api/enrich` |

#### Benefits:
- ✅ Prevents brute force attacks
- ✅ Stops DoS attacks
- ✅ Protects server resources
- ✅ Returns clear error messages with retry information

#### Implementation:
```javascript
// In server/middleware/security.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  }
});

// Applied in server/index.js
app.use('/api/inventory', apiLimiter, inventoryRoutes);
```

---

### 2. **Input Sanitization** ✅

Prevents NoSQL injection attacks by sanitizing user inputs.

#### What It Does:
- Removes `$` and `.` characters from inputs
- Prevents MongoDB query injection
- Logs sanitization attempts in production

#### Example Attack Prevented:
```javascript
// Malicious input:
{ "email": { "$ne": null } }

// After sanitization:
{ "email": { "_ne": null } }  // Safe!
```

#### Implementation:
```javascript
const mongoSanitize = require('express-mongo-sanitize');

app.use(mongoSanitize({
  replaceWith: '_'
}));
```

---

### 3. **Security Headers (Helmet)** ✅

Sets HTTP headers to protect against XSS, clickjacking, and other attacks.

#### Headers Set:
- `Content-Security-Policy` - Prevents XSS attacks
- `X-Frame-Options` - Prevents clickjacking
- `X-Content-Type-Options` - Prevents MIME sniffing
- `Strict-Transport-Security` - Forces HTTPS
- `X-DNS-Prefetch-Control` - Controls DNS prefetching

#### Implementation:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co"]
    }
  }
}));
```

---

### 4. **Production-Safe Logging** ✅

Prevents sensitive data leakage in production logs.

#### Development vs Production:

**Development:**
```
[2025-11-04T19:38:08.914Z] POST /api/login
Body: {
  "email": "user@example.com",
  "password": "***"
}
```

**Production:**
```
[2025-11-04T19:38:08.914Z] POST /api/login - [SENSITIVE] - IP: 123.45.67.89
```

#### What's Protected:
- ❌ No passwords in logs
- ❌ No email addresses in production
- ❌ No request bodies for sensitive routes
- ✅ Only IP address and timestamp logged

#### Implementation:
```javascript
function requestLogger(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSensitive = ['/auth', '/login', '/password'].some(r => req.path.includes(r));

  if (isProduction && isSensitive) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - [SENSITIVE]`);
  }
  next();
}
```

---

### 5. **User ID Hashing** ✅

Protects user IDs in CloudMailin forwarding emails.

#### Problem:
Old format exposes user IDs:
```
a48947dbd077295c13ea+user-abc-123@cloudmailin.net
                        ^^^^^^^^^^^^ Anyone can see this!
```

#### Solution:
New format uses HMAC SHA-256 hashing:
```
a48947dbd077295c13ea+7f3a9b2c8d1e4f5a@cloudmailin.net
                        ^^^^^^^^^^^^^^^^ Hashed user ID
```

#### Benefits:
- ✅ User IDs are not exposed
- ✅ Cannot guess other users' emails
- ✅ One-way hash (cannot reverse)
- ✅ Backwards compatible with old format

#### Implementation:
```javascript
const crypto = require('crypto');

function hashUserId(userId) {
  const secret = process.env.USER_ID_SECRET;
  return crypto
    .createHmac('sha256', secret)
    .update(userId)
    .digest('hex')
    .substring(0, 16);
}

// Generate forwarding email
const forwardingEmail = `cloudmailin+${hashUserId(user.id)}@cloudmailin.net`;
```

#### Setup Required:
1. Generate a secret key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to `.env`:
   ```bash
   USER_ID_SECRET=your-generated-secret-here
   ```

3. Update frontend to use new format:
   ```javascript
   // In Inventory.tsx or wherever email is displayed
   import { generateForwardingEmail } from '../services/api';
   const email = generateForwardingEmail(user.id);
   ```

---

### 6. **UUID Validation** ✅

Validates UUIDs in API routes to prevent SQL injection.

#### What It Validates:
- User IDs
- Email IDs
- Order IDs
- Inventory item IDs

#### Example:
```javascript
// Valid UUID:
'550e8400-e29b-41d4-a716-446655440000' ✅

// Invalid (SQL injection attempt):
'1 OR 1=1; DROP TABLE users;--' ❌

// Middleware usage:
app.get('/api/inventory/:userId',
  validateUUIDParam('userId'),
  handler
);
```

---

### 7. **CORS Configuration** ✅

Strict cross-origin resource sharing settings.

#### Allowed Origins:
- ✅ `http://localhost:5173` (development)
- ✅ `https://optiprofit.app` (production)
- ✅ `https://www.optiprofit.app` (production with www)
- ✅ Vercel preview deployments
- ❌ All other origins blocked

#### What It Prevents:
- Cross-site request forgery (CSRF)
- Unauthorized API access
- Data theft from other websites

---

### 8. **Error Handling** ✅

Production-safe error responses that don't leak sensitive information.

#### Development:
```json
{
  "error": "ValidationError",
  "message": "Invalid user ID format",
  "stack": "Error: Invalid user ID format\n    at validateUUID (...)",
  "details": { "received": "invalid-id" }
}
```

#### Production:
```json
{
  "error": "Request Error",
  "message": "Invalid user ID format",
  "timestamp": "2025-11-04T19:38:08.914Z",
  "requestId": "abc-123"
}
```

#### Benefits:
- ❌ No stack traces in production
- ❌ No internal paths revealed
- ✅ User-friendly messages
- ✅ Detailed logs server-side for debugging

---

## 🔒 Security Checklist for Deployment

### Before Going Live:

- [ ] **Environment Variables Set**
  - [ ] `NODE_ENV=production`
  - [ ] `USER_ID_SECRET` (strong random value)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (kept secret)
  - [ ] All API keys secured

- [ ] **CORS Configured**
  - [ ] Production domain added to `allowedOrigins`
  - [ ] No wildcard origins (`*`) in production
  - [ ] Credentials properly configured

- [ ] **Rate Limiting Active**
  - [ ] Test rate limits with load testing
  - [ ] Adjust limits based on expected traffic
  - [ ] Monitor rate limit hits in logs

- [ ] **Logging Configured**
  - [ ] `NODE_ENV=production` set
  - [ ] No sensitive data in logs
  - [ ] Error monitoring tool setup (Sentry recommended)

- [ ] **HTTPS Enforced**
  - [ ] SSL certificate installed
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header enabled

- [ ] **Database Security**
  - [ ] Row-level security (RLS) enabled in Supabase
  - [ ] Service role key not exposed to frontend
  - [ ] Database backups configured

- [ ] **Dependencies Updated**
  - [ ] Run `npm audit` and fix vulnerabilities
  - [ ] Update packages regularly
  - [ ] Use `npm audit fix` for automatic fixes

---

## 🚨 Common Security Mistakes to Avoid

### ❌ Don't Do This:

1. **Exposing Secrets in Code**
   ```javascript
   // BAD: Hardcoded secret
   const secret = 'my-secret-key';

   // GOOD: Use environment variables
   const secret = process.env.USER_ID_SECRET;
   ```

2. **Logging Sensitive Data**
   ```javascript
   // BAD: Logs password
   console.log('User login:', req.body);

   // GOOD: Log only non-sensitive data
   console.log('User login:', req.body.email);
   ```

3. **Accepting All CORS Origins**
   ```javascript
   // BAD: Allows any origin
   app.use(cors({ origin: '*' }));

   // GOOD: Whitelist specific origins
   app.use(cors({ origin: allowedOrigins }));
   ```

4. **No Rate Limiting**
   ```javascript
   // BAD: No protection
   app.post('/api/login', loginHandler);

   // GOOD: Rate limit sensitive routes
   app.post('/api/login', authLimiter, loginHandler);
   ```

5. **Detailed Error Messages in Production**
   ```javascript
   // BAD: Leaks stack trace
   res.status(500).json({ error: err.stack });

   // GOOD: Generic message
   res.status(500).json({ error: 'Internal Server Error' });
   ```

---

## 📊 Monitoring Security

### What to Monitor:

1. **Rate Limit Hits**
   - Watch for IPs hitting rate limits
   - Investigate unusual patterns
   - Adjust limits if needed

2. **Failed Authentication Attempts**
   - Log failed login attempts
   - Alert on brute force attempts
   - Consider IP blocking for repeat offenders

3. **Input Sanitization Triggers**
   - Log when sanitization occurs
   - Investigate potential attacks
   - Update validation rules if needed

4. **CORS Violations**
   - Log blocked origins
   - Investigate unauthorized access attempts
   - Update allowed origins if legitimate

5. **Error Rates**
   - Monitor 4xx and 5xx errors
   - Set up alerts for spikes
   - Investigate root causes

---

## 🛠️ Testing Security

### Manual Tests:

1. **Rate Limiting**
   ```bash
   # Test API rate limit (should block after 100 requests)
   for i in {1..110}; do
     curl http://localhost:3001/api/inventory/test-user-id
   done
   ```

2. **CORS**
   ```bash
   # Test blocked origin (should fail)
   curl -H "Origin: https://evil.com" http://localhost:3001/api/health

   # Test allowed origin (should succeed)
   curl -H "Origin: https://optiprofit.app" http://localhost:3001/api/health
   ```

3. **Input Sanitization**
   ```bash
   # Test NoSQL injection (should be sanitized)
   curl -X POST http://localhost:3001/api/login \
     -H "Content-Type: application/json" \
     -d '{"email": {"$ne": null}}'
   ```

4. **UUID Validation**
   ```bash
   # Test invalid UUID (should return 400)
   curl http://localhost:3001/api/inventory/invalid-id

   # Test SQL injection (should return 400)
   curl http://localhost:3001/api/inventory/1%20OR%201=1
   ```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common security vulnerabilities
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://express-rate-limit.mintlify.app/)
- [Supabase Security Guide](https://supabase.com/docs/guides/platform/security)

---

## 🆘 Security Incident Response

### If You Detect a Security Issue:

1. **Immediate Actions:**
   - Take affected service offline if critical
   - Rotate all API keys and secrets
   - Review logs for extent of breach
   - Document everything

2. **Investigation:**
   - Identify attack vector
   - Determine what data was accessed
   - Find all affected users
   - Preserve evidence

3. **Remediation:**
   - Fix vulnerability
   - Deploy patch immediately
   - Force password resets if needed
   - Notify affected users

4. **Post-Incident:**
   - Conduct security review
   - Update security measures
   - Document lessons learned
   - Implement additional monitoring

---

## 📞 Security Contacts

- **Report Security Issues:** [Your security email]
- **Emergency Contact:** [Your phone number]
- **Bug Bounty Program:** [If applicable]

---

**Last Updated:** November 4, 2025
**Security Version:** 1.0
**Next Review:** [Set quarterly review date]
