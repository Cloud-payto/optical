-- Check inventory status distribution for your account
SELECT
  status,
  COUNT(*) as count,
  STRING_AGG(DISTINCT brand, ', ') as brands
FROM inventory
WHERE account_id = '4e47aad7-bee1-4787-9624-3ed4219a7373'
GROUP BY status
ORDER BY count DESC;

-- Check recent orders
SELECT
  order_number,
  status,
  order_date,
  customer_name
FROM orders
WHERE account_id = '4e47aad7-bee1-4787-9624-3ed4219a7373'
ORDER BY created_at DESC
LIMIT 10;

-- Check if items have 'confirmed' or 'current' or 'pending' status
SELECT
  id,
  brand,
  model,
  status,
  created_at
FROM inventory
WHERE account_id = '4e47aad7-bee1-4787-9624-3ed4219a7373'
ORDER BY created_at DESC
LIMIT 20;
