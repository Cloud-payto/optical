# Bug Fix: Partial Orders Showing All Frames Instead of Only Unreceived

## Problem

When a user partially confirmed an order (e.g., 33 out of 36 frames), and then revisited the order in the "Partial Orders" column, all 36 frames were still showing instead of just the 3 remaining unreceived frames.

## Root Cause

The `confirmPendingOrder` function was querying for items with `status = 'pending'`, but when frames are confirmed, they are updated to:
- `received = TRUE`
- `status = 'current'`

This meant the query was only finding frames that were never touched, not frames that had already been received.

## Solution

Changed the query logic to filter by the `received` column instead of the `status` column:

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

## Files Changed

**File:** `server/lib/supabase.js`

**Changes:**
1. Line 319-323: Updated query for fallback path (when order not in orders table)
2. Line 363-369: Updated query for main path (when order exists in orders table)
3. Line 377: Updated error message to say "No unreceived items" instead of "No pending items"

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
