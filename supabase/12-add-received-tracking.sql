-- Migration 012: Add received tracking to inventory for partial order receipt
-- This migration adds the ability to track individual frame receipt status
-- enabling partial order confirmations where only some frames have been received

-- ============================================================================
-- PART 1: Add received column to inventory table
-- ============================================================================

-- Add received boolean column to inventory table
-- NULL = not yet shipped, FALSE = shipped but not received, TRUE = received
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS received BOOLEAN DEFAULT NULL;

-- ============================================================================
-- PART 2: Add comments
-- ============================================================================

COMMENT ON COLUMN public.inventory.received IS 'Tracks whether individual frame has been physically received. NULL = not yet shipped/pending, FALSE = shipped but not yet received, TRUE = physically received and confirmed';

COMMENT ON COLUMN public.inventory.received_date IS 'Date when frame was marked as received. Set when received changes from FALSE/NULL to TRUE. Used for return window calculations.';

-- ============================================================================
-- PART 3: Migrate existing data
-- ============================================================================

-- Set received status based on current inventory status
-- - pending items: NULL (not yet shipped)
-- - current/sold/archived items: TRUE (already confirmed = already received)
UPDATE public.inventory
SET received = CASE
  WHEN status = 'pending' THEN NULL
  WHEN status IN ('current', 'sold', 'archived') THEN TRUE
  ELSE NULL
END
WHERE received IS NULL;

-- Set received_date for items that are marked as received but don't have a date
-- Use created_at as fallback for historical data
UPDATE public.inventory
SET received_date = created_at::date
WHERE received = TRUE
  AND received_date IS NULL
  AND created_at IS NOT NULL;

-- ============================================================================
-- PART 4: Add indexes for performance
-- ============================================================================

-- Index for efficient queries filtering by order and received status
CREATE INDEX IF NOT EXISTS idx_inventory_order_received
ON public.inventory(order_id, received)
WHERE order_id IS NOT NULL;

-- Index for finding partially received orders and filtering by account
CREATE INDEX IF NOT EXISTS idx_inventory_account_status_received
ON public.inventory(account_id, status, received)
WHERE status IN ('pending', 'current');

-- Index for efficiently finding received items by date (for return windows)
CREATE INDEX IF NOT EXISTS idx_inventory_received_date
ON public.inventory(account_id, received_date)
WHERE received = TRUE AND received_date IS NOT NULL;

-- ============================================================================
-- PART 5: Add helper function to check if order is complete
-- ============================================================================

-- Function to check if all items in an order have been received
CREATE OR REPLACE FUNCTION is_order_fully_received(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_items INTEGER;
  v_received_items INTEGER;
BEGIN
  -- Count total items and received items for this order
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE received = TRUE)
  INTO v_total_items, v_received_items
  FROM inventory
  WHERE order_id = p_order_id;

  -- If no items, return false
  IF v_total_items = 0 THEN
    RETURN FALSE;
  END IF;

  -- Return true if all items are received
  RETURN v_received_items = v_total_items;
END;
$$;

-- Add comment
COMMENT ON FUNCTION is_order_fully_received(UUID) IS 'Returns TRUE if all inventory items for the given order have received=TRUE, FALSE otherwise';
