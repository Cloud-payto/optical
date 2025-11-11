# OptiProfit Demo System - API Integration Guide

## Overview

This guide explains how the OptiProfit demo system integrates with Supabase Edge Functions to provide a fully functional, session-based demo experience.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │ DemoContext  │──────│  mockData.ts │──────│ Supabase     │ │
│  │              │      │  (API calls) │      │ Client       │ │
│  └──────────────┘      └──────────────┘      └──────┬───────┘ │
│                                                      │         │
└──────────────────────────────────────────────────────┼─────────┘
                                                       │
                                                       │ HTTPS
                                                       │
┌──────────────────────────────────────────────────────┼─────────┐
│                  Supabase Edge Functions             │         │
│                                                      │         │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────▼──────┐  │
│  │ demo-initialize│  │ demo-vendor    │  │ demo-order     │  │
│  │ (POST)         │  │ (GET)          │  │ (GET)          │  │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘  │
│           │                   │                    │          │
│  ┌────────┴───────┐  ┌────────┴───────┐  ┌────────┴───────┐  │
│  │ demo-inventory │  │ demo-pricing   │  │ demo-progress  │  │
│  │ (GET)          │  │ (GET)          │  │ (PATCH)        │  │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘  │
│           │                   │                    │          │
│  ┌────────┴───────┐  ┌────────┴───────┐           │          │
│  │ demo-extend    │  │ demo-cleanup   │           │          │
│  │ (POST)         │  │ (DELETE)       │           │          │
│  └────────┬───────┘  └────────┬───────┘           │          │
│           │                   │                    │          │
│           └───────────────────┴────────────────────┘          │
│                              │                                │
│                              ▼                                │
│                    ┌──────────────────┐                       │
│                    │ PostgreSQL       │                       │
│                    │ (demo_data table)│                       │
│                    └──────────────────┘                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Database Schema

The demo system uses a single `demo_data` table with JSONB columns for flexibility:

```sql
CREATE TABLE demo_data (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  -- Demo progress tracking
  step_progress INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',

  -- Demo data (JSONB for flexibility)
  vendor_data JSONB,
  order_data JSONB,
  inventory_items JSONB,
  brand_pricing JSONB
);
```

See `DEMO_SYSTEM_IMPLEMENTATION.md` for complete schema details.

## API Endpoints

### 1. Initialize Demo Session
**POST** `/demo-initialize`

Creates a new demo session and returns all demo data.

```typescript
// Request
const { data } = await supabase.functions.invoke('demo-initialize', {
  body: { durationMinutes: 60 }
});

// Response
{
  success: true,
  data: {
    sessionId: "uuid-here",
    expiresAt: "2025-11-11T16:00:00Z",
    vendor: { /* Company object */ },
    order: { /* DemoOrder object */ },
    inventoryItems: [ /* DemoInventoryItem[] */ ],
    brandPricing: [ /* Brand[] */ ]
  }
}
```

### 2. Get Vendor Data
**GET** `/demo-vendor?sessionId=xxx`

Returns vendor information for the session.

### 3. Get Order Data
**GET** `/demo-order?sessionId=xxx`

Returns parsed order email data.

### 4. Get Inventory Items
**GET** `/demo-inventory?sessionId=xxx&status=pending`

Returns inventory items, optionally filtered by status.

### 5. Get Brand Pricing
**GET** `/demo-pricing?sessionId=xxx&brandName=Modern%20Optics`

Returns brand pricing data, optionally filtered by brand name.

### 6. Update Progress
**PATCH** `/demo-progress`

Updates current step and completed steps.

```typescript
const { data } = await supabase.functions.invoke('demo-progress', {
  body: {
    sessionId: "uuid-here",
    currentStep: 5,
    completedSteps: [1, 2, 3, 4, 5]
  }
});
```

### 7. Extend Session
**POST** `/demo-extend`

Extends session expiration by 1 hour.

```typescript
const { data } = await supabase.functions.invoke('demo-extend', {
  body: { sessionId: "uuid-here" }
});
```

### 8. Cleanup Session
**DELETE** `/demo-cleanup?sessionId=xxx`

Marks session as inactive.

## Frontend Integration

### Session Management (mockData.ts)

The `mockData.ts` file now includes complete session management:

```typescript
// Session storage keys
const SESSION_STORAGE_KEY = 'demo_session_id';
const SESSION_EXPIRY_KEY = 'demo_session_expiry';

// Get current session
export const getDemoSessionId = (): string | null;

// Set session (called after initialization)
export const setDemoSessionId = (sessionId: string, expiresAt: string): void;

// Clear session
export const clearDemoSession = (): void;

// Check if expired
export const isDemoSessionExpired = (): boolean;
```

### API Integration Functions

All API calls are wrapped in helper functions with automatic fallback to mock data:

```typescript
// Initialize new session
export const initializeDemoSession = async (durationMinutes: number = 60): Promise<DemoData>;

// Fetch individual data types
export const getDemoVendor = async (): Promise<Company | null>;
export const getDemoOrder = async (): Promise<DemoOrder | null>;
export const getDemoInventory = async (status?: string): Promise<DemoInventoryItem[]>;
export const getDemoPricing = async (brandName?: string): Promise<any[]>;

// Progress tracking
export const updateDemoProgress = async (currentStep: number, completedSteps: number[]): Promise<boolean>;

// Session management
export const extendDemoSession = async (): Promise<boolean>;
export const cleanupDemoSession = async (): Promise<boolean>;

// Main fetch function (smart session handling)
export const fetchDemoData = async (): Promise<DemoData>;
```

### DemoContext Integration

The `DemoContext` now uses API calls:

```typescript
// src/contexts/DemoContext.tsx

const startDemo = useCallback(async () => {
  setState(prev => ({ ...prev, isActive: true, isLoading: true }));

  try {
    const demoData = await fetchDemoData();
    setState(prev => ({ ...prev, demoData, isLoading: false }));
  } catch (error) {
    // Fallback to mock data
    setState(prev => ({ ...prev, demoData: DEMO_DATA, isLoading: false }));
  }
}, []);

const endDemo = useCallback(async () => {
  await cleanupDemoSession();
  setState({ isActive: false, demoData: null, ... });
}, []);
```

## Deployment Workflow

### Step 1: Deploy Edge Functions

```bash
# Navigate to project directory
cd /path/to/Version1

# Login to Supabase (if not already logged in)
supabase login

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions at once
./supabase/deploy-functions.sh

# OR deploy individually
supabase functions deploy demo-initialize
supabase functions deploy demo-vendor
# ... etc
```

### Step 2: Verify Deployment

```bash
# List all deployed functions
supabase functions list

# View logs for a specific function
supabase functions logs demo-initialize --follow
```

### Step 3: Test Endpoints

See `supabase/functions/README.md` for complete cURL test examples.

Example:
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-initialize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes": 60}'
```

### Step 4: Configure Environment Variables

Ensure your frontend has these environment variables set:

```env
# .env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Update CORS (Production)

Before deploying to production, update CORS headers:

```typescript
// supabase/functions/_shared/cors.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-production-domain.com',
  // ... other headers
};
```

Then redeploy all functions:
```bash
supabase functions deploy --all
```

## Development Mode

The system automatically falls back to mock data when:

1. Supabase is not configured (`VITE_SUPABASE_URL` not set)
2. User is not authenticated
3. API calls fail

This allows development without backend:

```typescript
// In mockData.ts
if (!isSupabaseConfigured) {
  console.warn('[DEMO API] Supabase not configured, using mock data');
  return DEMO_DATA;
}
```

## Session Flow

### Initialization
1. User clicks "Start Demo" button
2. `DemoContext.startDemo()` is called
3. `fetchDemoData()` checks for existing session
4. If no session or expired → calls `initializeDemoSession()`
5. Backend creates row in `demo_data` table
6. Session ID stored in `sessionStorage`
7. Demo data returned and injected into context

### During Demo
1. User navigates through steps
2. `DemoContext.nextStep()` updates UI
3. Progress tracked via `updateDemoProgress()`
4. Backend updates `step_progress` and `completed_steps`

### Cleanup
1. User completes demo or clicks "Skip"
2. `DemoContext.endDemo()` is called
3. `cleanupDemoSession()` marks session inactive
4. Session ID removed from `sessionStorage`
5. UI returns to normal state

## Error Handling

All API functions include robust error handling:

```typescript
try {
  const { data, error } = await supabase.functions.invoke('demo-vendor', {
    body: { sessionId }
  });

  if (error || !data?.success) {
    console.error('[DEMO API] Error:', error || data?.error);
    return DEMO_VENDOR; // Fallback to mock data
  }

  return data.data;
} catch (error) {
  console.error('[DEMO API] Exception:', error);
  return DEMO_VENDOR; // Fallback to mock data
}
```

This ensures:
- Demo continues working even if backend fails
- Development works without backend
- Users get consistent experience
- Errors are logged for debugging

## Security

### Authentication
All endpoints require valid JWT token:

```typescript
const authHeader = req.headers.get('Authorization')!;
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return errorResponse('Unauthorized', 'AUTH_REQUIRED', 401);
}
```

### Row-Level Security (RLS)
Database policies ensure users can only access their own sessions:

```sql
CREATE POLICY "Users can only access their own demo sessions"
ON demo_data FOR ALL
TO authenticated
USING (auth.uid() = user_id);
```

### Input Validation
All session IDs are validated:

```typescript
if (!sessionId || !validateUUID(sessionId)) {
  return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
}
```

## Monitoring

### View Logs
```bash
# Real-time logs for all functions
supabase functions logs --follow

# Specific function logs
supabase functions logs demo-initialize --tail 100
```

### Track Sessions
Query active demo sessions:

```sql
SELECT
  session_id,
  user_id,
  created_at,
  expires_at,
  step_progress,
  completed_steps,
  is_active
FROM demo_data
WHERE is_active = true
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

## Troubleshooting

### Issue: "Supabase not configured"
**Solution:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

### Issue: "Authorization header missing"
**Solution:** User must be logged in before starting demo

### Issue: "Session not found"
**Solution:** Session may have expired. System will automatically create new session.

### Issue: CORS error in browser
**Solution:** Update `cors.ts` with frontend domain and redeploy functions

### Issue: Functions timeout
**Solution:** Check database indexes and query performance

## Next Steps

1. ✅ Deploy Edge Functions to Supabase
2. ✅ Test all 8 endpoints with cURL
3. ✅ Verify frontend integration
4. ⏳ Add data-demo attributes to UI components (Priority 2)
5. ⏳ Test complete demo flow end-to-end
6. ⏳ Update CORS for production deployment

## Additional Resources

- **API Reference:** `supabase/functions/README.md`
- **Database Schema:** `docs/technical/DEMO_SYSTEM_IMPLEMENTATION.md`
- **UI Integration:** `docs/technical/DATA_DEMO_ATTRIBUTES_GUIDE.md`
- **Project Summary:** `DEMO_SYSTEM_OVERHAUL_SUMMARY.md`
