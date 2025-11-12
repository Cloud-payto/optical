# Demo Feature Implementation Analysis

**Last Updated:** 2025-11-11
**Purpose:** Comprehensive analysis of the current demo feature implementation for prompt engineering optimization

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Data Flow](#data-flow)
4. [Current Implementation](#current-implementation)
5. [Database Schema](#database-schema)
6. [Known Issues & Pain Points](#known-issues--pain-points)
7. [Recommendations](#recommendations)

---

## Executive Summary

### What is the Demo Feature?

The demo feature allows new users to experience OptiProfit with pre-populated data (order confirmations, inventory management, pricing calculations) without needing to connect real vendor accounts or import actual data.

### Current State

The demo system uses **two different approaches** that appear to be in conflict:

1. **Database-backed approach** (newer, partially implemented)
   - Demo user ID: `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`
   - Real data in database (vendors, orders, inventory)
   - RLS policies grant read access to demo data
   - SQL scripts exist to populate demo data

2. **Mock data approach** (older, partially implemented)
   - Demo user ID: `00000000-0000-0000-0000-000000000DEMO`
   - Client-side mock data injection
   - SessionStorage-based demo mode flag

### The Core Problem

**The system doesn't know which approach to use**, leading to:
- Conflicting user IDs (`3251cae7...` vs `00000000...`)
- Backend doesn't recognize demo mode (API just treats demo user ID as a normal user)
- Frontend tries to inject mock data that doesn't align with backend reality
- No clear handoff between "entering demo mode" and "API returns demo data"

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DemoButton.tsx                                              │
│    └─> Triggers startDemo()                                 │
│                                                              │
│  DemoContext.tsx (DemoProvider)                              │
│    ├─> State: isActive, currentStep, demoData               │
│    ├─> Sets sessionStorage.setItem('demo_session_id')       │
│    └─> Uses DEMO_DATA from mockData.ts (UNUSED?)            │
│                                                              │
│  services/api.ts                                             │
│    ├─> isDemoModeActive() checks sessionStorage             │
│    ├─> Returns DEMO_USER_ID (3251cae7...)                   │
│    └─> Makes API calls with demo or real user ID            │
│                                                              │
│  demoConstants.ts                                            │
│    └─> DEMO_USER_ID = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'│
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP Request with Bearer Token
                             │ /api/orders/{userId}
                             │ /api/inventory/{userId}
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  server/routes/orders.js                                     │
│    ├─> GET /api/orders/:userId                              │
│    └─> Just queries database with userId                    │
│        (NO demo mode awareness)                              │
│                                                              │
│  server/lib/supabase.js                                      │
│    ├─> orderOperations.getOrdersByAccount(userId)           │
│    ├─> inventoryOperations.getInventoryByAccount(userId)    │
│    └─> Uses userId directly in SQL queries                  │
│        (NO special handling for demo user)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Supabase Query
                             │ SELECT * FROM orders WHERE account_id = userId
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RLS Policies (04-fix-demo-rls-policies.sql)                │
│    ├─> Allow reads for demo account ID                      │
│    └─> Demo ID: 3251cae7-ee61-4c5f-be4c-4312c17ef4fd        │
│                                                              │
│  Demo Data (demo-data-insert.sql) - NOT FULLY LOADED        │
│    ├─> Demo user ID: 00000000-0000-0000-0000-000000000DEMO  │
│    ├─> Vendor: Modern Optical                               │
│    ├─> Order #6817 (18 frames)                              │
│    └─> Inventory items                                      │
│                                                              │
│  Actual Tables:                                              │
│    ├─> auth.users (demo user may not exist)                 │
│    ├─> vendors (Modern Optical data)                        │
│    ├─> emails (order email)                                 │
│    ├─> orders (Order #6817)                                 │
│    └─> inventory (18 frame records)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Current Demo Activation Flow

**User Action:**
User clicks "Watch Demo" button

**What Happens:**

```
1. DemoButton.tsx onClick → startDemo()

2. DemoContext.tsx startDemo():
   ├─> sessionStorage.setItem('demo_session_id', 'active')
   ├─> setState({ isActive: true, demoData: DEMO_DATA })
   └─> Console logs suggest navigating to /frames/orders

3. User navigates to Orders page

4. Orders page component:
   ├─> useAuth() → gets authenticated user
   ├─> api.ts → getCurrentUserIdFromSession()
   │   ├─> isDemoModeActive() checks sessionStorage
   │   ├─> Returns DEMO_USER_ID (3251cae7...) if demo active
   │   └─> Returns real user.id if not demo
   ├─> Calls GET /api/orders/{userId}
   └─> Backend queries database

5. Backend (server/routes/orders.js):
   ├─> Receives userId parameter
   ├─> NO demo mode detection
   ├─> Calls orderOperations.getOrdersByAccount(userId)
   └─> SELECT * FROM orders WHERE account_id = userId

6. Database:
   ├─> RLS policies check if userId can read data
   ├─> If userId = 3251cae7... → Allow read of demo account data
   └─> Returns orders (IF demo data exists for that ID)
```

**The Problem:**
- Demo data SQL uses ID `00000000-0000-0000-0000-000000000DEMO`
- Frontend uses ID `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`
- **These don't match**, so no demo data is returned

---

## Current Implementation

### Frontend Implementation

#### 1. Demo Constants (`src/demo/demoConstants.ts`)

```typescript
export const DEMO_USER_ID = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
export const DEMO_START_ROUTE = '/frames/orders';
export const DEMO_DURATION_MINUTES = 60;

export const DEMO_DATA_IDS = {
  VENDOR_ID: 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', // Modern Optical
  ORDER_ID: '50fa0961-9d44-4190-95ce-b57be229ba62',   // Order #6817
  EMAIL_ID: 'dda6c11f-59b3-426c-88d0-a300b79e2dab',   // Order email
};
```

#### 2. Demo Context (`src/contexts/DemoContext.tsx`)

**State:**
```typescript
interface DemoState {
  isActive: boolean;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  demoData: DemoData | null;
  originalUserData: any | null;
}
```

**Key Methods:**

- `startDemo()`: Sets `sessionStorage.setItem('demo_session_id', 'active')`, activates demo
- `endDemo()`: Removes session storage flag, cleans up
- `injectDemoData()`: Sets `demoData` in state (appears unused)
- `restoreUserData()`: Clears demo data

**Issues:**
- Comments say "actual data comes from backend API" but also sets `demoData: DEMO_DATA`
- Not clear which data source is authoritative
- No server-side session tracking (only sessionStorage)

#### 3. API Service (`src/services/api.ts`)

```typescript
function isDemoModeActive(): boolean {
  const demoSessionId = sessionStorage.getItem('demo_session_id');
  return !!demoSessionId;
}

async function getCurrentUserIdFromSession(): Promise<string> {
  if (isDemoModeActive()) {
    return DEMO_USER_ID; // 3251cae7-ee61-4c5f-be4c-4312c17ef4fd
  }
  // ... get real user from Supabase auth
}
```

**This works correctly** - it will send the demo user ID to the backend when demo is active.

### Backend Implementation

#### 1. Routes (`server/routes/orders.js`, `inventory.js`, etc.)

```javascript
// GET /api/orders/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const orders = await orderOperations.getOrdersByAccount(userId);
  res.json({ success: true, orders });
});
```

**Issues:**
- No demo mode detection
- Treats demo user ID like any other user ID
- No special handling or validation

#### 2. Supabase Operations (`server/lib/supabase.js`)

```javascript
async getOrdersByAccount(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, vendor:vendors(name), items:inventory(*)')
    .eq('account_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}
```

**Issues:**
- No demo mode awareness
- Just passes userId through to query
- Relies entirely on RLS policies for access control

### Database Implementation

#### 1. Demo User IDs (CONFLICT!)

**RLS Policies** (`supabase/04-fix-demo-rls-policies.sql`):
```sql
CREATE POLICY "Users can view their own inventory"
ON public.inventory FOR SELECT
USING (
  account_id IN (SELECT id FROM auth.users WHERE auth.uid() = id)
  OR
  account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'::uuid -- Demo account
);
```

**Demo Data SQL** (`supabase/demo-data-insert.sql`):
```sql
INSERT INTO auth.users (id, ...) VALUES (
  '00000000-0000-0000-0000-000000000DEMO', -- DIFFERENT ID!
  ...
);

INSERT INTO public.orders (account_id, ...) VALUES (
  '00000000-0000-0000-0000-000000000DEMO', -- Uses different ID
  ...
);
```

**This is the critical mismatch!**

#### 2. Demo Data Structure

The SQL scripts define comprehensive demo data:

**Vendor:**
- Modern Optical (ID: `f1d2aaf8-1877-4579-9ed0-083541dae7e7`)
- Email: custsvc@modernoptical.com
- Full email patterns for parser matching

**Email:**
- Order confirmation for Order #6817
- Complete parsed_data JSON with 18 frames
- Includes UPCs, brands, models, colors, sizes

**Order:**
- Order #6817
- Customer: MARANA EYE CARE (#93277)
- Placed by: Payton Millet
- Date: 9/5/2025
- 18 total pieces

**Inventory:**
- 18 individual frame records
- Brands: B.M.E.C., GB+ COLLECTION, MODERN PLASTICS II
- Each with SKU, UPC, size, color, enriched_data

#### 3. Tables Involved

```
auth.users         → Demo user account
vendors            → Modern Optical
emails             → Order confirmation email
orders             → Order #6817
inventory          → 18 frame records
```

---

## Database Schema

### Relevant Tables

```sql
-- Demo user authentication
auth.users
  ├─ id (uuid) PRIMARY KEY
  ├─ email (varchar)
  ├─ encrypted_password
  └─ email_confirmed_at

-- Demo vendor data
public.vendors
  ├─ id (uuid) PRIMARY KEY
  ├─ name (varchar) UNIQUE
  ├─ code (varchar)
  ├─ email_patterns (jsonb)
  └─ is_active (boolean)

-- Demo order email
public.emails
  ├─ id (uuid) PRIMARY KEY
  ├─ account_id (uuid) → references auth.users
  ├─ vendor_id (uuid) → references vendors
  ├─ subject (text)
  ├─ parsed_data (jsonb) ← Contains 18 frames
  └─ parse_status (varchar)

-- Demo order
public.orders
  ├─ id (uuid) PRIMARY KEY
  ├─ account_id (uuid) → references auth.users
  ├─ vendor_id (uuid) → references vendors
  ├─ email_id (uuid) → references emails
  ├─ order_number (varchar)
  ├─ customer_name (varchar)
  └─ total_pieces (integer)

-- Demo inventory (18 frames)
public.inventory
  ├─ id (uuid) PRIMARY KEY
  ├─ account_id (uuid) → references auth.users
  ├─ vendor_id (uuid) → references vendors
  ├─ order_id (uuid) → references orders
  ├─ sku, brand, model, color, size
  ├─ status (varchar) ← 'pending' or 'current'
  └─ enriched_data (jsonb)
```

### RLS Policies

**Current RLS allows demo account to READ data:**

```sql
-- Inventory: Allow read for demo account
account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'

-- Orders: Allow read for demo account
account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
```

**But does NOT allow writes** (which is correct for demo mode).

---

## Known Issues & Pain Points

### 🔴 Critical Issues

#### 1. **Mismatched Demo User IDs**

**Problem:**
- RLS policies use: `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`
- Demo data SQL uses: `00000000-0000-0000-0000-000000000DEMO`
- Frontend uses: `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`

**Impact:**
- When demo is active, frontend sends `3251cae7...` to API
- Database has NO data for `3251cae7...` (demo data is for `00000000...`)
- Result: Empty orders/inventory when demo is active

**Root Cause:**
- Demo data SQL script was created with generic UUID
- RLS policies and frontend were updated to different UUID
- Scripts were never synchronized

#### 2. **Demo Data May Not Be Loaded in Database**

**Problem:**
- Multiple SQL files exist (different versions)
- No clear "source of truth" for which SQL to run
- Unclear if demo data has actually been inserted into production database

**Files:**
- `01-create-demo-account.sql`
- `02-insert-demo-data.sql`
- `02-insert-demo-data-FIXED.sql`
- `03-simple-demo-data.sql`
- `demo-data-insert.sql`
- `demo-data-insert-fixed.sql`
- `demo-data-cleanup-and-insert.sql`

**Impact:**
- Even if IDs matched, data might not exist
- No verification that demo data is present
- No automated way to ensure demo data persists

#### 3. **Backend Has No Demo Mode Awareness**

**Problem:**
- Backend routes treat demo user ID as normal user ID
- No validation that demo user exists
- No special error handling for demo mode
- No rate limiting or sandboxing for demo

**Impact:**
- Poor error messages when demo fails
- No protection against demo data corruption
- Can't track demo usage/analytics separately

#### 4. **Client-Side Only Demo State**

**Problem:**
- Demo mode tracked only in `sessionStorage`
- No server-side demo session
- Page refresh might lose demo context
- No way to expire demo sessions server-side

**Impact:**
- Demo could remain "active" indefinitely
- No analytics on demo usage
- Can't clean up demo data after expiration

### 🟡 Medium Issues

#### 5. **Unclear Data Flow**

**Problem:**
- Comments say "actual data comes from backend"
- But also sets `demoData: DEMO_DATA` in context
- `mockData.ts` file exists but appears unused
- Two different approaches (mock vs database-backed) coexist

**Impact:**
- Confusion for developers
- Unused code
- Potential bugs from assuming wrong data source

#### 6. **No Demo Mode Indicator in UI**

**Problem:**
- No visible indication user is in demo mode
- Could confuse users into thinking demo data is real
- No easy way to exit demo

**Impact:**
- User confusion
- Potential data expectations mismatch

#### 7. **Demo Data Not Realistic**

**Problem:**
- Order date in future (9/5/2025)
- Only 1 vendor, 1 order, 18 frames
- All items in "pending" status
- No price variation or real-world messiness

**Impact:**
- Doesn't showcase full app capabilities
- Users may not see value proposition
- Doesn't represent real usage patterns

### 🟢 Minor Issues

#### 8. **Missing Demo Cleanup**

**Problem:**
- `cleanupDemoSession()` function called but implementation unknown
- No way to reset demo data if user corrupts it
- No automated cleanup of old demo sessions

#### 9. **No Demo Analytics**

**Problem:**
- No tracking of:
  - How many users start demo
  - Which steps users complete
  - Where users drop off
  - How long users spend in demo

#### 10. **Hard-Coded Demo User ID**

**Problem:**
- Demo user ID is hard-coded in multiple places
- No environment variable or config
- Makes it hard to have different demo environments (staging vs prod)

---

## Recommendations

### Immediate Fixes (Must Do)

#### ✅ 1. Align Demo User IDs

**Solution:**
Pick ONE demo user ID and use it everywhere:

**Option A: Use `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`**
- Update demo data SQL scripts to use this ID
- Keep RLS policies as-is
- Keep frontend constants as-is

**Option B: Use `00000000-0000-0000-0000-000000000DEMO`**
- Update RLS policies to use this ID
- Update frontend `demoConstants.ts` to use this ID
- Keep demo data SQL as-is

**Recommendation: Option A** (less risky, doesn't change RLS)

**Implementation:**
```sql
-- Update all INSERT statements in demo-data-insert.sql
-- Change this:
'00000000-0000-0000-0000-000000000DEMO'
-- To this:
'3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
```

#### ✅ 2. Consolidate Demo Data SQL Scripts

**Solution:**
- Create single source-of-truth SQL file: `supabase/demo-data-insert-FINAL.sql`
- Delete all other demo SQL files or move to archive
- Add cleanup/reset section to script
- Document how to run it

**Implementation:**
```sql
-- demo-data-insert-FINAL.sql

-- Step 1: Cleanup existing demo data
DELETE FROM inventory WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM orders WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
-- ... etc

-- Step 2: Insert fresh demo data
INSERT INTO vendors ...
INSERT INTO orders ...
-- ... etc

-- Step 3: Verification
SELECT 'Demo data loaded' as status,
  (SELECT COUNT(*) FROM orders WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd') as order_count,
  (SELECT COUNT(*) FROM inventory WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd') as inventory_count;
```

#### ✅ 3. Add Backend Demo Mode Detection

**Solution:**
Add middleware to detect and validate demo mode.

**Implementation:**
```javascript
// server/middleware/demo.js
const DEMO_USER_ID = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';

function isDemoUser(userId) {
  return userId === DEMO_USER_ID;
}

function validateDemoMode(req, res, next) {
  const { userId } = req.params;

  if (isDemoUser(userId)) {
    req.isDemo = true;
    req.userId = DEMO_USER_ID;
    console.log('🎭 Demo mode request detected');
  } else {
    req.isDemo = false;
    req.userId = userId;
  }

  next();
}

module.exports = { isDemoUser, validateDemoMode };
```

**Usage in routes:**
```javascript
const { validateDemoMode } = require('../middleware/demo');

router.get('/:userId', validateDemoMode, async (req, res) => {
  // req.isDemo is now available
  const orders = await orderOperations.getOrdersByAccount(req.userId);
  res.json({
    success: true,
    orders,
    isDemo: req.isDemo // Include in response for debugging
  });
});
```

### Short-Term Improvements (Should Do)

#### 🎯 4. Add Demo Mode UI Indicator

**Solution:**
Add banner at top of page when in demo mode.

**Implementation:**
```tsx
// src/components/DemoBanner.tsx
export function DemoBanner() {
  const { isActive, endDemo } = useDemo();

  if (!isActive) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 text-center">
      <div className="flex items-center justify-center gap-4">
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">
          You're in Demo Mode - This is sample data
        </span>
        <button
          onClick={endDemo}
          className="px-4 py-1 bg-white/20 rounded hover:bg-white/30 transition"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
```

#### 🎯 5. Improve Demo Data Realism

**Solution:**
- Use current/past dates (not future)
- Add more variety (2-3 vendors, 5-10 orders)
- Include some "current" inventory items
- Add items with varying prices
- Include some common issues (missing prices, etc.)

#### 🎯 6. Add Demo Analytics

**Solution:**
Use `demo_analytics` table that already exists in schema.

**Implementation:**
```javascript
// Track demo step completion
async function trackDemoStep(sessionId, userId, stepNumber, stepName) {
  await supabase
    .from('demo_analytics')
    .insert({
      session_id: sessionId,
      user_id: userId,
      step_number: stepNumber,
      step_name: stepName,
      completed: true,
      time_spent_seconds: 0 // Calculate based on start time
    });
}
```

### Long-Term Enhancements (Nice to Have)

#### 🚀 7. Server-Side Demo Sessions

**Solution:**
Track demo sessions in `demo_data` table (already exists).

**Benefits:**
- Can expire sessions server-side
- Can track usage analytics
- Can reset demo data per session
- Can have multiple concurrent demos

#### 🚀 8. Interactive Demo Guide

**Solution:**
Use Driver.js or similar library for step-by-step walkthrough.

**Already referenced in code:**
```typescript
// DemoContext.tsx line 63
console.log('🎬 Starting Driver.js demo...');
```

Implement actual Driver.js integration.

#### 🚀 9. Demo Data Sandboxing

**Solution:**
Instead of shared demo data, create isolated demo data per session.

**Benefits:**
- Users can't affect each other
- Can allow demo writes safely
- More realistic experience
- Can show "before/after" workflows

---

## File Reference

### Frontend Files

```
src/
├── components/
│   └── demo/
│       ├── DemoButton.tsx          # "Watch Demo" button component
│       └── DemoProvider.tsx        # Context provider wrapper
├── contexts/
│   └── DemoContext.tsx             # Main demo state management
├── hooks/
│   └── useDemo.ts                  # Hook for accessing demo context
├── demo/
│   ├── demoConstants.ts            # Demo configuration (USER IDs, routes)
│   ├── demoSteps.ts                # Step definitions (unused?)
│   ├── demoUtils.ts                # Utility functions
│   └── mockData.ts                 # Mock data (appears unused)
└── services/
    └── api.ts                      # API service with demo mode detection
```

### Backend Files

```
server/
├── routes/
│   ├── orders.js                   # Order API endpoints
│   ├── inventory.js                # Inventory API endpoints
│   └── (other routes...)
└── lib/
    └── supabase.js                 # Database operations
```

### Database Files

```
supabase/
├── 01-create-demo-account.sql      # Demo user creation
├── 02-insert-demo-data.sql         # Demo data v1
├── 02-insert-demo-data-FIXED.sql   # Demo data v2
├── 03-simple-demo-data.sql         # Demo data v3
├── 04-fix-demo-rls-policies.sql    # RLS policies for demo ✓ (current)
├── demo-data-insert.sql            # Demo data v4 ✓ (most complete)
├── demo-data-insert-fixed.sql      # Demo data v5
└── demo-data-cleanup-and-insert.sql # Demo data v6
```

**Recommended:** Use `demo-data-insert.sql` as base, update IDs, rename to `demo-data-FINAL.sql`.

---

## Summary for Prompt Engineer

### The One-Line Problem

**The frontend sends demo user ID `3251cae7...` to the backend, but all demo data in the database uses ID `00000000...`, so the demo returns empty results.**

### What Needs to Happen

1. **Pick one demo user ID** and update all code/SQL to use it
2. **Load demo data into database** using correct ID
3. **Verify RLS policies** allow read access for demo ID
4. **Add demo mode detection** in backend for better debugging
5. **Add visual indicator** when user is in demo mode

### Current Behavior

```
User clicks "Watch Demo"
  → Frontend sets sessionStorage flag
  → Frontend sends API calls with userId = 3251cae7-ee61-4c5f-be4c-4312c17ef4fd
  → Backend queries database for that user
  → Database finds NO DATA (demo data uses different ID)
  → Returns empty arrays
  → User sees empty screens
```

### Desired Behavior

```
User clicks "Watch Demo"
  → Frontend sets sessionStorage flag
  → Frontend sends API calls with userId = 3251cae7-ee61-4c5f-be4c-4312c17ef4fd
  → Backend queries database for that user
  → Database finds DEMO DATA (vendor, order #6817, 18 frames)
  → Returns demo data
  → User sees populated demo screens
  → Banner shows "You're in Demo Mode"
```

### Next Steps

1. Update `demo-data-insert.sql` to use `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`
2. Run SQL in Supabase to load demo data
3. Test: Open app → Click "Watch Demo" → Should see Order #6817 with 18 frames
4. Add `DemoBanner` component to show demo mode indicator
5. Add backend middleware to track demo requests for analytics

---

## Questions to Clarify

1. **Has demo data been loaded into production database yet?**
   - If yes, which SQL script was used?
   - If no, which script should be run?

2. **Is there a demo user account in auth.users?**
   - Does `3251cae7-ee61-4c5f-be4c-4312c17ef4fd` exist?
   - Does `00000000-0000-0000-0000-000000000DEMO` exist?
   - Or does no demo user exist yet?

3. **What's the login flow for demo mode?**
   - Does user need to authenticate first?
   - Is demo accessible to logged-out users?
   - Is it a separate "demo" account they log into?
   - Or does their real account temporarily "become" demo account?

4. **Should demo mode allow writes?**
   - Can users confirm orders, add pricing in demo?
   - Or is it strictly read-only?
   - Should writes be sandboxed (written to separate session data)?

5. **What's the expected demo duration?**
   - Code says 60 minutes
   - Is this enforced?
   - What happens after expiration?

---

**End of Analysis**
