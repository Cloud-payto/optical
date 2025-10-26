-- Migration: Fix inventory status constraint to use 'current' instead of 'confirmed'
-- This aligns the database with the frontend expectations

-- Drop the old constraint
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_status_check;

-- Add new constraint with correct status values
ALTER TABLE inventory ADD CONSTRAINT inventory_status_check
  CHECK (status IN ('pending', 'current', 'archived', 'sold'));

-- Update any existing 'confirmed' items to 'current'
UPDATE inventory
SET status = 'current'
WHERE status = 'confirmed';

-- Verify the update
SELECT
  status,
  COUNT(*) as count
FROM inventory
GROUP BY status
ORDER BY count DESC;
