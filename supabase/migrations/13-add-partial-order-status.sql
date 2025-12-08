-- Migration 013: Add 'partial' status to orders for partial order receipt
-- This migration enables orders to have a 'partial' status when some but not all
-- frames have been received, with automatic status calculation via triggers

-- ============================================================================
-- PART 1: Modify orders status constraint to include 'partial'
-- ============================================================================

-- Drop the existing CHECK constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new CHECK constraint with 'partial' status
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'partial', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- Add comment explaining status transitions
COMMENT ON COLUMN public.orders.status IS
  'Order status with transitions: ' ||
  'pending (no items received) → ' ||
  'partial (some items received) → ' ||
  'confirmed (all items received) → ' ||
  'shipped → delivered. ' ||
  'Can be cancelled at any point.';

-- ============================================================================
-- PART 2: Add function to automatically calculate order status
-- ============================================================================

-- Function to calculate order status based on inventory received state
CREATE OR REPLACE FUNCTION calculate_order_status(p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total_items INTEGER;
  v_received_items INTEGER;
  v_pending_items INTEGER;
  v_current_status TEXT;
BEGIN
  -- Get current order status to avoid unnecessary updates
  SELECT status INTO v_current_status
  FROM orders
  WHERE id = p_order_id;

  -- Don't change status if order is in a terminal state
  IF v_current_status IN ('shipped', 'delivered', 'cancelled') THEN
    RETURN v_current_status;
  END IF;

  -- Count total items, received items, and pending items for this order
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE received = TRUE),
    COUNT(*) FILTER (WHERE received IS NULL OR received = FALSE)
  INTO v_total_items, v_received_items, v_pending_items
  FROM inventory
  WHERE order_id = p_order_id;

  -- If no items exist for this order, keep it as pending
  IF v_total_items = 0 THEN
    RETURN 'pending';
  END IF;

  -- If all items received, return confirmed
  IF v_received_items = v_total_items THEN
    RETURN 'confirmed';
  END IF;

  -- If some items received (but not all), return partial
  IF v_received_items > 0 THEN
    RETURN 'partial';
  END IF;

  -- Otherwise, no items received yet - still pending
  RETURN 'pending';
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION calculate_order_status(UUID) IS
  'Calculates order status based on inventory received state. ' ||
  'Returns: pending (0 received), partial (some received), confirmed (all received). ' ||
  'Does not change status for shipped/delivered/cancelled orders.';

-- ============================================================================
-- PART 3: Add trigger to auto-update order status when inventory changes
-- ============================================================================

-- Trigger function to update order status when inventory received field changes
CREATE OR REPLACE FUNCTION update_order_status_on_inventory_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_status TEXT;
  v_order_id UUID;
BEGIN
  -- Determine which order_id to update based on operation
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  -- Only proceed if order_id is set
  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate new status
  v_new_status := calculate_order_status(v_order_id);

  -- Update order status and timestamp
  UPDATE orders
  SET
    status = v_new_status,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_order_id
    -- Only update if status actually changed
    AND status != v_new_status
    -- Don't update terminal states
    AND status NOT IN ('shipped', 'delivered', 'cancelled');

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_order_status_on_inventory_change() IS
  'Trigger function that automatically updates order status when inventory items ' ||
  'are inserted, updated (received field), or deleted. Maintains order status consistency.';

-- Create trigger on inventory table
DROP TRIGGER IF EXISTS trg_update_order_status_on_inventory_change ON inventory;

CREATE TRIGGER trg_update_order_status_on_inventory_change
AFTER INSERT OR UPDATE OF received OR DELETE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_order_status_on_inventory_change();

COMMENT ON TRIGGER trg_update_order_status_on_inventory_change ON inventory IS
  'Automatically recalculates and updates order status when inventory items are modified';

-- ============================================================================
-- PART 4: Update existing orders to correct status based on inventory
-- ============================================================================

-- Update all existing orders to have the correct status based on their inventory
-- This is a one-time migration to fix any existing inconsistencies
DO $$
DECLARE
  v_order RECORD;
  v_new_status TEXT;
BEGIN
  -- Loop through all orders that are not in terminal state
  FOR v_order IN
    SELECT id, order_number, status
    FROM orders
    WHERE status NOT IN ('shipped', 'delivered', 'cancelled')
  LOOP
    -- Calculate what the status should be
    v_new_status := calculate_order_status(v_order.id);

    -- Update if different
    IF v_new_status != v_order.status THEN
      UPDATE orders
      SET
        status = v_new_status,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_order.id;

      RAISE NOTICE 'Updated order % from % to %',
        v_order.order_number, v_order.status, v_new_status;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 5: Add helper view for order receipt status (optional - for reporting)
-- ============================================================================

-- Create view for easy querying of order receipt status
CREATE OR REPLACE VIEW order_receipt_status AS
SELECT
  o.id as order_id,
  o.account_id,
  o.order_number,
  o.status as order_status,
  o.order_date,
  o.total_pieces,
  v.name as vendor_name,
  COUNT(i.id) as total_items,
  COUNT(i.id) FILTER (WHERE i.received = TRUE) as received_items,
  COUNT(i.id) FILTER (WHERE i.received IS NULL OR i.received = FALSE) as pending_items,
  CASE
    WHEN COUNT(i.id) = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(i.id) FILTER (WHERE i.received = TRUE) / COUNT(i.id), 1)
  END as percent_received,
  o.created_at,
  o.updated_at
FROM orders o
LEFT JOIN vendors v ON v.id = o.vendor_id
LEFT JOIN inventory i ON i.order_id = o.id
GROUP BY o.id, o.account_id, o.order_number, o.status, o.order_date,
         o.total_pieces, v.name, o.created_at, o.updated_at;

COMMENT ON VIEW order_receipt_status IS
  'Provides a summary view of order receipt status including counts and percentages ' ||
  'of received vs pending items. Useful for dashboards and reporting.';

-- ============================================================================
-- Verification queries (commented out - run manually if needed)
-- ============================================================================

-- Check status distribution:
-- SELECT status, COUNT(*) as count
-- FROM orders
-- WHERE status NOT IN ('shipped', 'delivered', 'cancelled')
-- GROUP BY status
-- ORDER BY status;

-- View orders with partial receipt:
-- SELECT * FROM order_receipt_status
-- WHERE order_status = 'partial'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Test the calculate_order_status function:
-- SELECT
--   o.order_number,
--   o.status as current_status,
--   calculate_order_status(o.id) as calculated_status,
--   COUNT(i.id) as total_items,
--   COUNT(i.id) FILTER (WHERE i.received = TRUE) as received_items
-- FROM orders o
-- LEFT JOIN inventory i ON i.order_id = o.id
-- WHERE o.status NOT IN ('shipped', 'delivered', 'cancelled')
-- GROUP BY o.id, o.order_number, o.status
-- ORDER BY o.created_at DESC
-- LIMIT 10;
