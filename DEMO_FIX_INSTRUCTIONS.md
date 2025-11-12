# 🎯 Demo System Fix - Complete Instructions

## Problem Summary

Your demo system isn't displaying data because:
1. **User ID Mismatch**: Code uses `3251cae7...` but no account exists with that ID
2. **Supabase Edge Functions Don't Exist**: Frontend tries to call non-existent functions, falls back to mock data
3. **Demo Account Never Created**: The database doesn't have the demo user/account

## Solution Overview

Instead of complex Supabase Edge Functions, we'll use your **existing backend API** with the demo account approach. Your code already supports this through `getCurrentUserIdFromSession()` which returns `DEMO_USER_ID` when demo mode is active!

---

## 📋 Step-by-Step Fix

### **Step 1: Create Demo Auth User in Supabase Dashboard (5 min)**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/bllrhafpqvzqahwxauzg
2. Go to **Authentication** → **Users**
3. Click **"Add User"** → **"Create New User"**
4. Fill in the form:
   ```
   Email: demo@opti-profit.internal
   Password: DemoP@ssw0rd2024!
   User ID: 3251cae7-ee61-4c5f-be4c-4312c17ef4fd
   ```
5. **Important**: Check "Auto Confirm User" (so user doesn't need email verification)
6. In **User Metadata** field, paste:
   ```json
   {"name": "Demo User", "is_demo_account": true}
   ```
7. Click **"Create User"**

**Why this way?** Creating through Supabase UI ensures all auth hooks/triggers fire correctly.

---

### **Step 2: Run SQL Scripts in Supabase SQL Editor (10 min)**

1. Open **SQL Editor** in Supabase Dashboard
2. Run **Script 1**: `supabase/01-create-demo-account.sql`
   - Creates the account record in `public.accounts` table
   - Links to the auth user you just created
3. Run **Script 2**: `supabase/02-insert-demo-data.sql`
   - Creates Modern Optical vendor
   - Creates Order #6817 with 18 frames
   - All inventory items set to "pending" status (perfect for demo)

**Verify it worked:**
```sql
-- Check account exists
SELECT id, name, email FROM accounts
WHERE id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';

-- Check inventory count
SELECT COUNT(*) as total_frames FROM inventory
WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
-- Should return: 18
```

---

### **Step 3: Update Frontend - Remove Supabase Edge Function Calls (15 min)**

Your `mockData.ts` file tries to call Supabase Edge Functions that don't exist. Since your backend API already supports demo mode through `getCurrentUserIdFromSession()`, we just need to simplify the demo initialization:

**File:** `src/contexts/DemoContext.tsx`

**Change the `startDemo` function from:**
```typescript
const startDemo = useCallback(async () => {
  console.log('🎬 Starting Driver.js demo...');

  sessionStorage.setItem('demo_session_id', 'active');

  setState(prev => ({ ...prev, isActive: true, isLoading: true, currentStep: 1 }));

  try {
    const demoData = await fetchDemoData(); // ❌ This calls Edge Functions
    setState(prev => ({ ...prev, demoData, isLoading: false }));
  } catch (error) {
    console.error('❌ Error loading demo data:', error);
    setState(prev => ({ ...prev, demoData: DEMO_DATA, isLoading: false }));
  }
}, []);
```

**To:**
```typescript
const startDemo = useCallback(async () => {
  console.log('🎬 Starting Driver.js demo...');

  // Set demo mode flag - this tells API service to use DEMO_USER_ID
  sessionStorage.setItem('demo_session_id', 'active');
  console.log('🎭 Demo mode flag set - API will use demo user ID');

  setState(prev => ({
    ...prev,
    isActive: true,
    isLoading: false, // No async loading needed
    currentStep: 1,
    demoData: DEMO_DATA // Use local mock data for structure
  }));

  // Backend API will automatically return demo data because
  // getCurrentUserIdFromSession() detects demo_session_id and returns DEMO_USER_ID
  console.log('✅ Demo initialized - navigate to /frames/orders to see demo data');
}, []);
```

**Why this works:**
- Your `api.ts` already checks for `demo_session_id` in sessionStorage
- When detected, it returns `DEMO_USER_ID` (3251cae7...)
- Your backend API fetches data for that user ID
- The data from your database (18 frames, Order #6817) displays automatically!

---

### **Step 4: Test the Demo (5 min)**

1. **Start your dev servers:**
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Backend API
   cd server
   npm run dev
   ```

2. **Test the flow:**
   - Navigate to your app (http://localhost:5173)
   - Click "Start Demo" button
   - You should be redirected to `/frames/orders`
   - **Expected result**: You should see Order #6817 with 18 pending frames

3. **Check browser console:**
   ```
   🎬 Starting Driver.js demo...
   🎭 Demo mode flag set - API will use demo user ID
   ✅ Demo initialized
   🎭 Demo mode detected - returning demo user ID for API calls
   ```

4. **Verify data displays:**
   - Orders page shows Order #6817
   - 18 inventory items visible
   - All items show "pending" status
   - Modern Optical vendor displays

---

## 🐛 Troubleshooting

### **Issue: "No data displays"**

**Check 1: Is demo account created?**
```sql
SELECT * FROM accounts WHERE id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
```
If empty → Re-run Step 1 & Step 2

**Check 2: Is demo mode active?**
Open browser console and check:
```javascript
sessionStorage.getItem('demo_session_id') // Should return: "active"
```
If null → Demo wasn't started, click "Start Demo" button again

**Check 3: Are API calls using demo ID?**
Check Network tab in DevTools:
- Look for calls to `/api/orders` or `/api/inventory`
- Check the Authorization header or query parameters
- Should be using account_id: `3251cae7-ee61-4c5f-be4c-4312c17ef4fd`

---

### **Issue: "401 Unauthorized"**

Your backend requires auth, but demo mode should work without login.

**Fix:** Update your backend auth middleware to allow demo mode:

```typescript
// server/middleware/auth.ts (or wherever your auth middleware is)

export function optionalAuth(req, res, next) {
  // Check if this is a demo mode request
  const isDemoMode = sessionStorage?.getItem('demo_session_id') === 'active';

  if (isDemoMode) {
    // Allow demo requests without auth
    req.user = { id: '3251cae7-ee61-4c5f-be4c-4312c17ef4fd' };
    return next();
  }

  // Normal auth flow for real users
  // ... existing auth code ...
}
```

---

### **Issue: "Still seeing mock data instead of database data"**

This means your components are using `DEMO_DATA` from `mockData.ts` instead of fetching from API.

**Fix:** Check your page components (Orders, Inventory) are calling your API service, not using mock data directly.

**Example fix for Orders page:**
```typescript
// ❌ Bad - using mock data
import { DEMO_ORDER } from '../demo/mockData';
const orders = DEMO_ORDER;

// ✅ Good - fetching from API
import { getOrders } from '../services/api';
const orders = await getOrders(); // Will return demo data when demo mode is active
```

---

## ✅ Success Criteria

When working correctly, you should see:

1. **Console logs:**
   ```
   🎬 Starting Driver.js demo...
   🎭 Demo mode flag set in sessionStorage
   🎭 Demo mode detected - returning demo user ID for API calls
   ```

2. **Data displays:**
   - Order #6817 visible in Orders page
   - 18 frames in inventory (all "pending" status)
   - Modern Optical vendor information
   - Modern Optical brand names (B.M.E.C., GB+ COLLECTION, MODERN PLASTICS II)

3. **Driver.js tour works:**
   - Highlights appear on correct elements
   - Tour steps reference actual data (not placeholders)
   - Can navigate through all tour steps

---

## 📚 How It All Works

**Flow when user clicks "Start Demo":**

```
1. User clicks "Start Demo" button
   ↓
2. DemoContext.startDemo() runs
   ↓
3. Sets sessionStorage.demo_session_id = 'active'
   ↓
4. Navigates to /frames/orders
   ↓
5. Orders page component mounts
   ↓
6. Calls getOrders() from api.ts
   ↓
7. api.ts checks sessionStorage.demo_session_id
   ↓
8. Detects demo mode → returns DEMO_USER_ID
   ↓
9. Backend API query: SELECT * FROM orders WHERE account_id = '3251cae7...'
   ↓
10. Database returns Order #6817 with 18 frames
   ↓
11. Data displays in UI → Driver.js highlights elements
```

**The magic:** Your existing `getCurrentUserIdFromSession()` function in `api.ts` already handles the demo mode detection. You just need the database account to exist!

---

## 🔄 Cleanup (Optional)

If you want to reset demo data or remove it:

```sql
-- Delete all demo data
DELETE FROM inventory WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM orders WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM emails WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM vendors WHERE id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7';
DELETE FROM accounts WHERE id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';

-- Then delete from auth (Supabase Dashboard → Authentication → Users)
-- Find demo@opti-profit.internal and delete
```

Then re-run Steps 1-2 to recreate fresh demo data.

---

## 🎉 That's It!

Your demo system is now using:
- ✅ Real database data (not Edge Functions)
- ✅ Existing backend API (already supports demo mode)
- ✅ Shared demo account (3251cae7...)
- ✅ 18 realistic inventory items
- ✅ Order #6817 ready for tours

The key insight: **You don't need Supabase Edge Functions!** Your backend API + demo account approach is simpler and already mostly implemented.
