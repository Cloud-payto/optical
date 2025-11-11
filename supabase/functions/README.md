# Supabase Edge Functions - Demo System API

This directory contains 8 Edge Functions that power the OptiProfit demo system.

## 📁 Structure

```
supabase/functions/
├── _shared/                    # Shared utilities
│   ├── cors.ts                # CORS headers
│   ├── response.ts            # Response helpers
│   └── validation.ts          # Validation utilities
├── demo-initialize/           # POST - Initialize demo session
├── demo-vendor/               # GET - Get vendor data
├── demo-order/                # GET - Get order data
├── demo-inventory/            # GET - Get inventory items
├── demo-pricing/              # GET - Get brand pricing
├── demo-progress/             # PATCH - Update progress
├── demo-extend/               # POST - Extend session
└── demo-cleanup/              # DELETE - Cleanup session
```

## 🚀 Deployment Instructions

### Prerequisites

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to Your Project**
   ```bash
   # Find your project ref in Supabase Dashboard > Settings > General
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Deploy All Functions

**Option 1: Deploy all at once** (recommended)
```bash
cd /path/to/Version1

# Deploy all functions
supabase functions deploy demo-initialize
supabase functions deploy demo-vendor
supabase functions deploy demo-order
supabase functions deploy demo-inventory
supabase functions deploy demo-pricing
supabase functions deploy demo-progress
supabase functions deploy demo-extend
supabase functions deploy demo-cleanup
```

**Option 2: Deploy individually**
```bash
supabase functions deploy demo-initialize
# ... repeat for each function
```

### Verify Deployment

1. **Check function list**
   ```bash
   supabase functions list
   ```

2. **View function logs**
   ```bash
   supabase functions logs demo-initialize
   ```

## 🧪 Testing Endpoints

### Get Your Auth Token

1. Go to Supabase Dashboard > Authentication > Users
2. Click on your test user
3. Copy the JWT token from the browser console after login

OR programmatically:
```javascript
const { data } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
});
const token = data.session.access_token;
```

### Test with cURL

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_JWT_TOKEN` with your authentication token

#### 1. Initialize Demo Session
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-initialize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes": 60}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "expiresAt": "2025-11-11T16:00:00Z",
    "vendor": { ... },
    "order": { ... },
    "inventoryItems": [ ... ],
    "brandPricing": [ ... ]
  }
}
```

#### 2. Get Vendor Data
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-vendor?sessionId=SESSION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Get Order Data
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-order?sessionId=SESSION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get Inventory (all items)
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-inventory?sessionId=SESSION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Inventory (filtered by status)
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-inventory?sessionId=SESSION_ID&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Get Pricing Data
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-pricing?sessionId=SESSION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 7. Update Progress
```bash
curl -X PATCH \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "currentStep": 5,
    "completedSteps": [1, 2, 3, 4, 5]
  }'
```

#### 8. Extend Session
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-extend \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "SESSION_ID"}'
```

#### 9. Cleanup Session
```bash
curl -X DELETE \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-cleanup?sessionId=SESSION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Environment Variables

These are automatically set by Supabase:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Your public API key

Verify with:
```bash
supabase secrets list
```

## 🌐 CORS Configuration

**IMPORTANT:** Update CORS headers for production!

Edit `supabase/functions/_shared/cors.ts`:

```typescript
// Development (allow all)
'Access-Control-Allow-Origin': '*'

// Production (specific domain)
'Access-Control-Allow-Origin': 'https://your-frontend-domain.com'
```

After changing CORS, redeploy all functions:
```bash
supabase functions deploy --all
```

## 📊 Monitoring & Debugging

### View Logs
```bash
# Real-time logs
supabase functions logs demo-initialize --follow

# Recent logs
supabase functions logs demo-initialize --tail 100
```

### Common Issues

**Issue:** `Authorization header missing`
- **Fix:** Include `Authorization: Bearer YOUR_TOKEN` header

**Issue:** `Session not found`
- **Fix:** Verify session ID is correct and session hasn't expired

**Issue:** `CORS error in browser`
- **Fix:** Update `cors.ts` with your frontend domain and redeploy

**Issue:** `Function timeout`
- **Fix:** Edge Functions have a 10-second limit. All queries should complete quickly.

## 📈 Performance

Expected response times:
- `demo-initialize`: ~200-500ms (creates new row)
- All GET endpoints: <100ms (simple SELECT queries)
- `demo-progress`: <100ms (UPDATE query)
- `demo-extend`: <100ms (calls function)
- `demo-cleanup`: <100ms (UPDATE query)

## 🔒 Security

1. **RLS Policies:** Enforced at database level
2. **Authentication:** Required for all endpoints
3. **Session Validation:** Users can only access their own sessions
4. **UUID Validation:** Prevents injection attacks

## 📝 Next Steps

After deployment:

1. ✅ Test all 8 endpoints with cURL
2. ✅ Update frontend to use API (see below)
3. ✅ Add data-demo attributes to UI
4. ✅ Test complete demo flow
5. ✅ Update CORS for production

## 🔗 Frontend Integration

See `/src/demo/mockData.ts` for frontend API integration code.

Example:
```typescript
import { supabase } from '../lib/supabaseClient';

// Initialize demo
const { data } = await supabase.functions.invoke('demo-initialize', {
  body: { durationMinutes: 60 },
});

const sessionId = data.data.sessionId;
sessionStorage.setItem('demoSessionId', sessionId);
```

---

**Documentation:** See `/DEMO_SYSTEM_OVERHAUL_SUMMARY.md` for complete system overview
