# Bug Fix: Partial Orders Showing All Frames Instead of Only Unreceived

## Problem

When a user partially confirmed an order (e.g., 14 out of 18 frames), and then revisited the order in the "Partial Orders" section, all 18 frames were still showing in the modal instead of just the 4 remaining unreceived frames.

This made it impossible for users to see at a glance which frames still needed to be received.

## Root Cause

### Issue 1: confirmPendingOrder Query (FIXED)
The `confirmPendingOrder` function was querying for items with `status = 'pending'`, but when frames are confirmed, they are updated to:
- `received = TRUE`
- `status = 'current'`

This meant the query was only finding frames that were never touched, not frames that had already been received.

### Issue 2: getOrdersByAccount Not Filtering (FIXED - Current Update)
The `getOrdersByAccount` and `getOrderById` functions were returning ALL inventory items for every order, regardless of:
- The order's status (pending/partial/confirmed)
- The items' received status

For partial orders, this caused the frontend to receive all 18 frames instead of just the 4 unreceived ones.

## Solutions Implemented

### Fix 1: Confirm Order Endpoint (Previously Fixed)
Changed the query logic in `confirmPendingOrder` to filter by the `received` column instead of the `status` column:

**Before:**
```javascript
.eq('status', 'pending')
```

**After:**
```javascript
.or('received.is.null,received.eq.false')
```

This correctly filters for frames that have NOT been received yet, which includes:
- `received = NULL` - Not yet shipped/pending
- `received = FALSE` - Shipped but not yet received

Frames with `received = TRUE` (already confirmed) are now excluded.

### Fix 2: Get Orders Endpoints (Current Update)
Modified `getOrdersByAccount` and `getOrderById` to filter items based on order status:

**Location:** `server/lib/supabase.js:868-981`

**Changes:**
- Added post-processing logic to filter items for partial orders
- Only returns unreceived items (received = null or false) for partial orders
- Calculates accurate counts: `total_items`, `received_items`, `pending_items`
- Returns all items for non-partial orders (backward compatible)

**Code:**
```javascript
// For partial orders, only include unreceived items
if (order.status === 'partial') {
  const allItems = order.items || [];
  filteredItems = allItems.filter(item =>
    item.received === null || item.received === false
  );

  const receivedCount = allItems.filter(item => item.received === true).length;

  return {
    ...order,
    vendor: order.vendor?.name || 'Unknown Vendor',
    items: filteredItems, // Only unreceived items
    total_items: allItems.length, // Total frames in order
    received_items: receivedCount, // Already received
    pending_items: filteredItems.length // Still pending
  };
}
```

## Files Changed

**File:** `server/lib/supabase.js`

**Confirm Order Fix (Previously):**
1. Line 319-323: Updated query for fallback path (when order not in orders table)
2. Line 363-369: Updated query for main path (when order exists in orders table)
3. Line 377: Updated error message to say "No unreceived items" instead of "No pending items"

**Get Orders Fix (Current Update):**
1. Line 868-930: Updated `getOrdersByAccount()` to filter partial order items
2. Line 932-981: Updated `getOrderById()` to filter partial order items
3. Added logging to track filtered item counts for debugging

## Expected Behavior Now

### Scenario: Order with 36 frames

**Initial state:**
- All 36 frames have `received = NULL`
- Order status: `pending`

**After confirming 33 frames:**
- 33 frames have `received = TRUE`, `status = 'current'`
- 3 frames still have `received = NULL`, `status = 'pending'`
- Order status: `partial`

**When revisiting the order:**
- Query returns only the 3 frames with `received = NULL`
- User sees only the 3 remaining frames to confirm
- ✅ This is the correct behavior!

**After confirming the final 3 frames:**
- All 36 frames have `received = TRUE`, `status = 'current'`
- Order status: `confirmed`
- Query returns 0 frames (all received)

## Testing

To test this fix:

1. Create an order with multiple frames (e.g., 10 frames)
2. Partially confirm some frames (e.g., 7 out of 10)
3. Verify the order shows status = 'partial'
4. Revisit the order for confirmation
5. **Expected:** Should see only 3 remaining frames (not all 10)
6. Confirm the remaining 3 frames
7. **Expected:** Order status changes to 'confirmed', no frames left to confirm

## Backend Endpoint Behavior

**Endpoint:** `POST /api/inventory/:userId/confirm/:orderNumber`

**Body (omit for full confirmation of remaining frames):**
```json
{}
```

**Response for partial order with 3 frames remaining:**
```json
{
  "success": true,
  "message": "Confirmed 3 items",
  "updatedCount": 3,
  "orderStatus": "confirmed",
  "totalItems": 36,
  "receivedItems": 36,
  "pendingItems": 0
}
```

If you try to confirm when all frames are already received:
```json
{
  "success": false,
  "error": "No unreceived items found for order ORDER_NUMBER"
}
```

## Impact

- ✅ Users can now properly continue partial confirmations
- ✅ Only unreceived frames show up when revisiting an order
- ✅ No duplicate confirmations of already-received frames
- ✅ Clearer error messages

---

**Fix Date:** January 2025
**Status:** Deployed
