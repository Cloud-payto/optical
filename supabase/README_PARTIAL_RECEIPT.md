# Partial Order Receipt - Database Migrations

## Quick Start

Execute these SQL files **in order** via Supabase SQL Editor:

### 1️⃣ Migration 12: Add Received Tracking
**File:** `12-add-received-tracking.sql`

**What it does:**
- Adds `received` boolean column to `inventory` table
- Migrates existing data (pending → NULL, confirmed → TRUE)
- Adds performance indexes
- Creates `is_order_fully_received()` helper function

**Run this first!**

### 2️⃣ Migration 13: Add Partial Order Status
**File:** `13-add-partial-order-status.sql`

**What it does:**
- Adds 'partial' to order status enum
- Creates automatic status calculation function
- Creates trigger to auto-update order status when inventory changes
- Migrates existing orders to correct status
- Creates `order_receipt_status` view for reporting

**Run this second!**

## Verification Queries

After running both migrations, verify success:

```sql
-- 1. Check inventory received column
SELECT status, received, COUNT(*) as count
FROM inventory
GROUP BY status, received
ORDER BY status, received;

-- Expected:
-- status   | received | count
-- pending  | NULL     | X
-- current  | TRUE     | Y
-- sold     | TRUE     | Z

-- 2. Check order statuses
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status;

-- Expected to see 'pending', 'partial', 'confirmed', etc.

-- 3. Test the status calculation function
SELECT
  order_number,
  status,
  (SELECT calculate_order_status(id)) as calculated_status
FROM orders
WHERE status NOT IN ('shipped', 'delivered', 'cancelled')
LIMIT 5;

-- status and calculated_status should match

-- 4. View orders with receipt tracking
SELECT
  order_number,
  order_status,
  total_items,
  received_items,
  pending_items,
  percent_received
FROM order_receipt_status
ORDER BY created_at DESC
LIMIT 10;
```

## What Changed

### Inventory Table
```sql
-- NEW COLUMN
received BOOLEAN DEFAULT NULL
  -- NULL  = not yet shipped
  -- FALSE = shipped but not received
  -- TRUE  = physically received

-- EXISTING COLUMN (now used when received = TRUE)
received_date DATE
```

### Orders Table
```sql
-- UPDATED CONSTRAINT (added 'partial')
status CHECK (status IN (
  'pending',
  'partial',    -- NEW!
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
))
```

### New Database Objects

**Functions:**
- `calculate_order_status(order_id)` - Calculates correct status based on inventory
- `is_order_fully_received(order_id)` - Returns true if all frames received

**Triggers:**
- `trg_update_order_status_on_inventory_change` - Auto-updates order status

**Views:**
- `order_receipt_status` - Summary view for dashboards and reporting

## Status Transitions

The trigger automatically manages these transitions:

```
┌─────────┐
│ pending │ (0 frames received)
└────┬────┘
     │ confirm some frames
     ▼
┌─────────┐
│ partial │ (1-4 frames received)
└────┬────┘
     │ confirm remaining frames
     ▼
┌───────────┐
│ confirmed │ (all frames received)
└───────────┘
```

Reversible - unmarking frames moves status backward.

## Rollback (if needed)

If you need to undo these migrations:

```sql
-- 1. Disable trigger
ALTER TABLE inventory DISABLE TRIGGER trg_update_order_status_on_inventory_change;

-- 2. Revert constraint
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- 3. Fix partial orders
UPDATE orders
SET status = CASE
  WHEN (SELECT COUNT(*) FILTER (WHERE received = TRUE)
        FROM inventory WHERE order_id = orders.id) =
       (SELECT COUNT(*) FROM inventory WHERE order_id = orders.id)
  THEN 'confirmed'
  ELSE 'pending'
END
WHERE status = 'partial';

-- 4. Drop objects (optional)
DROP VIEW IF EXISTS order_receipt_status;
DROP TRIGGER IF EXISTS trg_update_order_status_on_inventory_change ON inventory;
DROP FUNCTION IF EXISTS update_order_status_on_inventory_change();
DROP FUNCTION IF EXISTS calculate_order_status(UUID);
DROP FUNCTION IF EXISTS is_order_fully_received(UUID);

-- 5. Remove column (optional - can keep for future use)
-- ALTER TABLE inventory DROP COLUMN received;
```

## Performance

**Indexes Added:**
- `idx_inventory_order_received` on (order_id, received)
- `idx_inventory_account_status_received` on (account_id, status, received)
- `idx_inventory_received_date` on (account_id, received_date)

**Trigger Performance:**
- Executes on INSERT/UPDATE/DELETE of inventory
- Typically <10ms for orders with <50 frames
- Only fires when `received` column changes or order_id is involved
- Skips terminal order states (shipped, delivered, cancelled)

## Support

**Check trigger status:**
```sql
SELECT tgname, tgenabled, tgtype
FROM pg_trigger
WHERE tgname = 'trg_update_order_status_on_inventory_change';
```

**Monitor trigger performance:**
```sql
SELECT * FROM pg_stat_user_triggers
WHERE schemaname = 'public'
  AND trgname = 'trg_update_order_status_on_inventory_change';
```

**Test function directly:**
```sql
-- Replace with actual order ID
SELECT calculate_order_status('12345678-1234-1234-1234-123456789012');
```

---

✅ After running both migrations, your database will support partial order receipt!
