-- ============================================================
-- SIMPLE Demo Data Insert (Minimal Version)
-- ============================================================
-- This creates ONLY the essential data:
-- 1. Vendor
-- 2. Order
-- 3. 18 Inventory Items
-- (Skips email to avoid JSON complexity)
-- ============================================================

DO $$
DECLARE
  v_demo_account_id UUID := '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'::uuid;
  v_vendor_id UUID := 'f1d2aaf8-1877-4579-9ed0-083541dae7e7'::uuid;
  v_order_id UUID := '50fa0961-9d44-4190-95ce-b57be229ba62'::uuid;
BEGIN

RAISE NOTICE '🎬 Starting simple demo data insert...';

-- ============================================================
-- 1. INSERT VENDOR: Modern Optical
-- ============================================================
INSERT INTO public.vendors (
  id,
  name,
  code,
  domain,
  is_active,
  created_at,
  updated_at,
  contact_email
) VALUES (
  v_vendor_id,
  'Modern Optical',
  'MODERN',
  'modernoptical.com',
  true,
  NOW() - INTERVAL '6 months',
  NOW(),
  'custsvc@modernoptical.com'
) ON CONFLICT (id) DO UPDATE
SET updated_at = NOW();

RAISE NOTICE '✅ Vendor created: Modern Optical';

-- ============================================================
-- 2. INSERT ORDER: Order #6817
-- ============================================================
INSERT INTO public.orders (
  id,
  account_id,
  vendor_id,
  email_id,
  order_number,
  account_number,
  customer_name,
  customer_phone,
  placed_by,
  order_date,
  total_pieces,
  status,
  created_at,
  updated_at
) VALUES (
  v_order_id,
  v_demo_account_id,
  v_vendor_id,
  NULL, -- Skip email for simplicity
  '6817',
  '93277',
  'MARANA EYE CARE',
  '520-833-6337',
  'Payton Millet',
  CURRENT_DATE - INTERVAL '1 day',
  18,
  'pending',
  NOW() - INTERVAL '2 hours',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET updated_at = NOW();

RAISE NOTICE '✅ Order created: #6817';

-- ============================================================
-- 3. INSERT INVENTORY: 18 Frames
-- ============================================================

-- Clean up old demo inventory first
DELETE FROM public.inventory WHERE account_id = v_demo_account_id;

-- Insert all 18 frames
INSERT INTO public.inventory (
  account_id, vendor_id, order_id,
  sku, brand, model, color, size, quantity, status, upc,
  created_at, updated_at
) VALUES
  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_AIR-BLACK', 'B.M.E.C.', 'BIG AIR', 'BLACK', '54', 1, 'pending', '675254228656',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_BEAT-BLACK_BROWN', 'B.M.E.C.', 'BIG BEAT', 'BLACK/BROWN', '60', 1, 'pending', '675254179613',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_BOLT-NAVY_FADE', 'B.M.E.C.', 'BIG BOLT', 'NAVY FADE', '58', 1, 'pending', '675254222883',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_DUDE-RUST_BROWN', 'B.M.E.C.', 'BIG DUDE', 'RUST/BROWN', '57', 1, 'pending', '675254231328',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_FLOW-NAVY_GUN_NAVY', 'B.M.E.C.', 'BIG FLOW', 'NAVY/GUN/NAVY', '58', 1, 'pending', '675254299588',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_FRONT-AQUA_BROWN_DEMI', 'B.M.E.C.', 'BIG FRONT', 'AQUA/BROWN DEMI', '57', 1, 'pending', '675254304657',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'B.M.E.C.-BIG_RIVER-GREY_GUNMETAL', 'B.M.E.C.', 'BIG RIVER', 'GREY/GUNMETAL', '55', 1, 'pending', '675254305487',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'GB+_COLLECTION-BEAUTIFUL-BLACK_GOLD', 'GB+ COLLECTION', 'BEAUTIFUL', 'BLACK/GOLD', '56', 1, 'pending', '675254228748',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'GB+_COLLECTION-DETERMINED-TEAL_PINK', 'GB+ COLLECTION', 'DETERMINED', 'TEAL/PINK', '58', 1, 'pending', '675254243062',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'GB+_COLLECTION-WONDROUS-PINK_CRYST_PK', 'GB+ COLLECTION', 'WONDROUS', 'PINK CRYST/PK', '54', 1, 'pending', '675254313710',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-CLEO-CLEO_BLACK_CRY', 'MODERN PLASTICS II', 'CLEO', 'CLEO BLACK CRY', '52', 1, 'pending', '675254300505',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-CONGENIAL-BLUE_PINK_CRYST', 'MODERN PLASTICS II', 'CONGENIAL', 'BLUE/PINK CRYST', '54', 1, 'pending', '675254314236',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-ESTIMATE-BLACK_BURG_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/BURG CRY', '54', 1, 'pending', '675254321807',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-ESTIMATE-BLACK_GREY_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/GREY CRY', '54', 1, 'pending', '675254321814',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-FICTION-BLACK_CRYST_GRY', 'MODERN PLASTICS II', 'FICTION', 'BLACK/CRYST GRY', '53', 1, 'pending', '675254303308',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-GRADIENT-NAVY_CRYST_BRN', 'MODERN PLASTICS II', 'GRADIENT', 'NAVY CRYST/BRN', '52', 1, 'pending', '675254314342',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-PATRICK-BLACK', 'MODERN PLASTICS II', 'PATRICK', 'BLACK', '55', 1, 'pending', '675254314656',
   NOW(), NOW()),

  (v_demo_account_id, v_vendor_id, v_order_id,
   'MODERN_PLASTICS_II-PATRICK-CRYSTAL', 'MODERN PLASTICS II', 'PATRICK', 'CRYSTAL', '55', 1, 'pending', '675254314663',
   NOW(), NOW());

RAISE NOTICE '✅ Inventory created: 18 frames';

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '✅ DEMO DATA COMPLETE!';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE 'Created:';
RAISE NOTICE '  ✓ 1 Vendor (Modern Optical)';
RAISE NOTICE '  ✓ 1 Order (#6817, pending status)';
RAISE NOTICE '  ✓ 18 Inventory items (all pending)';
RAISE NOTICE '';
RAISE NOTICE 'Demo Account: demo@optiprofit.com';
RAISE NOTICE 'Account ID: %', v_demo_account_id;
RAISE NOTICE '';

END $$;

-- Verify the data
SELECT
  'Demo Data Summary' as info,
  (SELECT COUNT(*)::text FROM vendors WHERE id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7') as vendors,
  (SELECT COUNT(*)::text FROM orders WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd') as orders,
  (SELECT COUNT(*)::text FROM inventory WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd') as inventory_items;
