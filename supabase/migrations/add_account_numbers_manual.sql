-- Manual Account Number Migration Script
-- Use this to add account numbers to existing orders and vendors

-- ============================================================================
-- OPTION 1: Add account numbers to existing orders
-- ============================================================================
-- Replace the vendor names and account numbers with your actual data

-- Example for Safilo (find your Safilo vendor_id first)
UPDATE orders
SET account_number = 'YOUR_SAFILO_ACCOUNT_NUMBER'
WHERE vendor_id = (SELECT id FROM vendors WHERE name = 'Safilo')
  AND account_id = 'YOUR_ACCOUNT_ID';

-- Example for Modern Optical
UPDATE orders
SET account_number = 'YOUR_MODERN_OPTICAL_ACCOUNT_NUMBER'
WHERE vendor_id = (SELECT id FROM vendors WHERE name = 'Modern Optical')
  AND account_id = 'YOUR_ACCOUNT_ID';

-- ============================================================================
-- OPTION 2: Add account numbers directly to account_vendors
-- ============================================================================
-- This sets the account number in account_vendors table for immediate display

-- Example for Safilo
UPDATE account_vendors
SET vendor_account_number = 'YOUR_SAFILO_ACCOUNT_NUMBER'
WHERE vendor_id = (SELECT id FROM vendors WHERE name = 'Safilo')
  AND account_id = 'YOUR_ACCOUNT_ID';

-- Example for Modern Optical
UPDATE account_vendors
SET vendor_account_number = 'YOUR_MODERN_OPTICAL_ACCOUNT_NUMBER'
WHERE vendor_id = (SELECT id FROM vendors WHERE name = 'Modern Optical')
  AND account_id = 'YOUR_ACCOUNT_ID';

-- ============================================================================
-- HELPER QUERIES: Find your vendor IDs and account ID
-- ============================================================================

-- Find your account ID (use your email)
SELECT id, email FROM accounts WHERE email = 'your-email@example.com';

-- Find all vendors and their IDs
SELECT id, name FROM vendors ORDER BY name;

-- Check which vendors you have in your account
SELECT av.vendor_account_number, v.name, v.id as vendor_id
FROM account_vendors av
JOIN vendors v ON av.vendor_id = v.id
WHERE av.account_id = 'YOUR_ACCOUNT_ID';

-- Check orders and their account numbers
SELECT o.order_number, o.account_number, v.name as vendor_name, o.vendor_id
FROM orders o
LEFT JOIN vendors v ON o.vendor_id = v.id
WHERE o.account_id = 'YOUR_ACCOUNT_ID'
ORDER BY o.created_at DESC
LIMIT 20;

-- ============================================================================
-- TESTING: Verify the changes
-- ============================================================================

-- After running the updates, check if account numbers are set
SELECT
  av.vendor_account_number,
  v.name as vendor_name,
  COUNT(o.id) as order_count
FROM account_vendors av
JOIN vendors v ON av.vendor_id = v.id
LEFT JOIN orders o ON o.vendor_id = av.vendor_id AND o.account_id = av.account_id
WHERE av.account_id = 'YOUR_ACCOUNT_ID'
GROUP BY av.vendor_account_number, v.name
ORDER BY v.name;
