# Automated Testing Guide

## Overview

This project uses **Vitest** for automated testing. Tests run automatically without needing to start the server manually.

## Why Automated Testing?

### Before (Manual Testing)
```bash
# Start server manually
npm run server

# Run test script in another terminal
node server/tests/test-webhook.js

# Read output, check if it worked
# Remember to run it again after changes
```

**Problems:**
- ❌ Time-consuming
- ❌ Easy to forget
- ❌ Can't catch regressions automatically
- ❌ No CI/CD integration

### After (Automated Testing)
```bash
# Run all tests with one command
npm test

# Tests run in seconds:
✓ POST /api/webhook/email - processes Safilo email (234ms)
✓ POST /api/webhook/email - processes Modern Optical email (156ms)
✓ GET /api/inventory/:userId - returns user inventory (89ms)
✓ SafiloService.parsePDF() - extracts order data correctly (45ms)

Tests: 4 passed, 4 total
Time: 2.3s
```

**Benefits:**
- ✅ Run all tests in seconds
- ✅ Catch breaking changes immediately
- ✅ Can deploy confidently
- ✅ Documents how your code should work

---

## Running Tests

### Run All Tests Once
```bash
npm test
```

### Run Tests in Watch Mode (re-runs on file changes)
```bash
npm run test:watch
```

### Run Tests with UI (visual interface)
```bash
npm run test:ui
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

---

## Test Structure

### API Tests
Tests for your Express API endpoints:
- `server/routes/webhook.test.js` - Email webhook processing
- `server/routes/inventory.test.js` - Inventory CRUD operations
- `server/routes/orders.test.js` - Order management (TODO)

### Parser Tests
Tests for vendor email parsers:
- `server/parsers/SafiloService.test.js` - Safilo PDF parsing
- `server/parsers/ModernOpticalService.test.js` - Modern Optical HTML parsing (TODO)

### Frontend Tests (TODO)
- `src/components/**/*.test.tsx` - React component tests
- `src/pages/**/*.test.tsx` - Page tests

---

## Writing New Tests

### Example: Testing an API Endpoint

```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('My Feature', () => {
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Example: Testing a Parser

```javascript
import { describe, it, expect } from 'vitest';
import MyParser from './MyParser';

describe('MyParser', () => {
  it('should extract order number', () => {
    const parser = new MyParser();
    const result = parser.extractOrderNumber('Order: 12345');

    expect(result).toBe('12345');
  });
});
```

---

## Mocking

Tests use mocks to avoid hitting real services:

```javascript
// Mock Supabase to avoid real database calls
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));
```

---

## Best Practices

1. **Test Critical Paths First**
   - Email webhook processing ✅
   - Vendor parsers ✅
   - Inventory operations ✅
   - Authentication (TODO)

2. **Test Error Cases**
   - Invalid input
   - Missing required fields
   - Network errors
   - Database errors

3. **Keep Tests Fast**
   - Use mocks instead of real APIs
   - Avoid unnecessary delays
   - Run tests in parallel

4. **Test Behavior, Not Implementation**
   - ✅ Good: "should return 200 when user is authenticated"
   - ❌ Bad: "should call getUserById with correct parameters"

---

## CI/CD Integration

### GitHub Actions (TODO)
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```

### Pre-commit Hook (TODO)
```bash
# Run tests before every commit
npm test || exit 1
```

---

## What's Tested Now

✅ **Webhook API**
- Email reception from CloudMailin
- Vendor detection (domain, subject, content)
- Error handling

✅ **Safilo Parser**
- Configuration
- Order data extraction
- Frame data parsing
- Error handling

✅ **Inventory API**
- Fetch inventory
- Confirm orders
- Mark as sold
- Archive/restore items
- Delete items

## What Needs Tests

⚠️ **Priority**
- [ ] Authentication flow
- [ ] Modern Optical parser
- [ ] Ideal Optics parser
- [ ] Order API endpoints
- [ ] Stats API endpoints

⚠️ **Medium Priority**
- [ ] React components
- [ ] Frontend routing
- [ ] Form validation
- [ ] Integration tests

⚠️ **Low Priority**
- [ ] E2E tests with Playwright
- [ ] Performance tests
- [ ] Load tests

---

## Troubleshooting

### Tests won't run
```bash
# Make sure dependencies are installed
npm install

# Check Vitest is installed
npx vitest --version
```

### Tests are failing
```bash
# Run tests in watch mode to see details
npm run test:watch

# Check if mocks are working
# Look for "Module not found" errors
```

### Import errors (ESM vs CommonJS)
```javascript
// If you see "Cannot use import statement outside a module"
// Make sure your test files use .js extension and import syntax

// Good:
import { describe, it } from 'vitest';

// Bad (for ESM):
const { describe, it } = require('vitest');
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
