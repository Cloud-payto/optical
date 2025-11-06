-- Fix: Update all 'confirmed' status to 'current' for your account
-- This fixes the mismatch between backend (old code used 'confirmed') and frontend (expects 'current')

UPDATE inventory
SET status = 'current'
WHERE account_id = '4e47aad7-bee1-4787-9624-3ed4219a7373'
  AND status = 'confirmed';

-- Verify the update
SELECT
  status,
  COUNT(*) as count
FROM inventory
WHERE account_id = '4e47aad7-bee1-4787-9624-3ed4219a7373'
GROUP BY status
ORDER BY count DESC;
