-- ============================================================
-- Step 2: Insert Complete Demo Data
-- ============================================================
-- This script populates the demo account with realistic data:
-- - Modern Optical vendor
-- - Order #6817 with 18 frames
-- - Inventory items (pending status)
-- ============================================================

DO $$
DECLARE
  v_demo_account_id UUID := '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'::uuid;
  v_vendor_id UUID := 'f1d2aaf8-1877-4579-9ed0-083541dae7e7'::uuid;
  v_email_id UUID := 'dda6c11f-59b3-426c-88d0-a300b79e2dab'::uuid;
  v_order_id UUID := '50fa0961-9d44-4190-95ce-b57be229ba62'::uuid;
BEGIN

RAISE NOTICE '🎬 Starting demo data insert for account: %', v_demo_account_id;

-- ============================================================
-- 1. INSERT VENDOR: Modern Optical
-- ============================================================
INSERT INTO public.vendors (
  id,
  name,
  code,
  domain,
  email_patterns,
  parser_service,
  is_active,
  settings,
  created_at,
  updated_at,
  contact_email,
  contact_phone
) VALUES (
  v_vendor_id,
  'Modern Optical',
  'MODERN',
  'modernoptical.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": ["modernoptical.com"]
    },
    "tier2": {
      "weight": 85,
      "body_signatures": [
        "custsvc@modernoptical.com",
        "modernoptical.com",
        "modern optical"
      ]
    }
  }'::jsonb,
  'ModernOpticalParser',
  true,
  '{}'::jsonb,
  NOW() - INTERVAL '6 months',
  NOW(),
  'custsvc@modernoptical.com',
  NULL
) ON CONFLICT (id) DO UPDATE
SET
  updated_at = NOW(),
  is_active = EXCLUDED.is_active;

RAISE NOTICE '✅ Vendor inserted/updated: Modern Optical';

-- ============================================================
-- 2. INSERT EMAIL: Order #6817 Confirmation
-- ============================================================
INSERT INTO public.emails (
  id,
  account_id,
  vendor_id,
  message_id,
  from_email,
  to_email,
  subject,
  received_at,
  raw_data,
  plain_text,
  html_text,
  attachments_count,
  spam_score,
  spam_status,
  parse_status,
  parsed_data,
  error_message,
  duplicate_order,
  duplicate_message,
  created_at,
  updated_at
) VALUES (
  v_email_id,
  v_demo_account_id,
  v_vendor_id,
  'demo-modern-optical-6817@system.local',
  'Modern Optical Orders <noreply@modernoptical.com>',
  'demo@opti-profit.internal',
  'Your Receipt for Order Number 6817',
  NOW() - INTERVAL '2 hours',
  '{"source":"demo","timestamp":"' || NOW()::text || '"}'::jsonb,
  E'From: Amro Habib <amrohabib@yahoo.com>
Sent: Friday, September 5, 2025 12:08 PM
To: Payton Millet <pmillet@modernoptical.com>
Subject: Fwd: Your Receipt for Order Number 6817

PLEASE DO NOT REPLY TO THIS EMAIL
If you have questions or need to comment on an order, send email to custsvc@modernoptical.com

Order
Order Number: 6817
Placed By Rep: Payton Millet
Date: 9/5/2025

Customer
MARANA EYE CARE (93277)
4340 W INA RD
TUCSON , AZ 85741-2232
Phone: 520-833-6337

Order Items:
B.M.E.C. - BIG AIR | BLACK | 54 | Qty: 1
B.M.E.C. - BIG BEAT | BLACK/BROWN | 60 | Qty: 1
B.M.E.C. - BIG BOLT | NAVY FADE | 58 | Qty: 1
B.M.E.C. - BIG DUDE | RUST/BROWN | 57 | Qty: 1
B.M.E.C. - BIG FLOW | NAVY/GUN/NAVY | 58 | Qty: 1
B.M.E.C. - BIG FRONT | AQUA/BROWN DEMI | 57 | Qty: 1
B.M.E.C. - BIG RIVER | GREY/GUNMETAL | 55 | Qty: 1
GB+ COLLECTION - BEAUTIFUL | BLACK/GOLD | 56 | Qty: 1
GB+ COLLECTION - DETERMINED | TEAL/PINK | 58 | Qty: 1
GB+ COLLECTION - WONDROUS | PINK CRYST/PK | 54 | Qty: 1
MODERN PLASTICS II - CLEO | CLEO BLACK CRY | 52 | Qty: 1
MODERN PLASTICS II - CONGENIAL | BLUE/PINK CRYST | 54 | Qty: 1
MODERN PLASTICS II - ESTIMATE | BLACK/BURG CRY | 54 | Qty: 1
MODERN PLASTICS II - ESTIMATE | BLACK/GREY CRY | 54 | Qty: 1
MODERN PLASTICS II - FICTION | BLACK/CRYST GRY | 53 | Qty: 1
MODERN PLASTICS II - GRADIENT | NAVY CRYST/BRN | 52 | Qty: 1
MODERN PLASTICS II - PATRICK | BLACK | 55 | Qty: 1
MODERN PLASTICS II - PATRICK | CRYSTAL | 55 | Qty: 1

Total Pieces: 18',
  '<html><!-- HTML version of email --></html>',
  0,
  0.00,
  'n8n',
  'parsed',
  '{
    "vendor": "Modern Optical",
    "order_number": "6817",
    "customer_name": "MARANA EYE CARE",
    "account_number": "93277",
    "total_pieces": 18,
    "rep_name": "Payton Millet",
    "order_date": "9/5/2025"
  }'::jsonb,
  NULL,
  false,
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO UPDATE
SET
  updated_at = NOW(),
  parse_status = EXCLUDED.parse_status;

RAISE NOTICE '✅ Email inserted/updated: Order #6817';

-- ============================================================
-- 3. INSERT ORDER: Order #6817
-- ============================================================
INSERT INTO public.orders (
  id,
  account_id,
  vendor_id,
  email_id,
  order_number,
  reference_number,
  account_number,
  customer_name,
  customer_code,
  customer_phone,
  placed_by,
  order_date,
  total_pieces,
  total_amount,
  status,
  tracking_number,
  shipped_date,
  delivered_date,
  metadata,
  created_at,
  updated_at
) VALUES (
  v_order_id,
  v_demo_account_id,
  v_vendor_id,
  v_email_id,
  '6817',
  NULL,
  '93277',
  'MARANA EYE CARE',
  NULL,
  '520-833-6337',
  'Payton Millet',
  CURRENT_DATE - INTERVAL '1 day', -- Yesterday's order
  18,
  NULL, -- Will be calculated from inventory
  'pending', -- Perfect for demo!
  NULL,
  NULL,
  NULL,
  '{"demo": true, "parsed_from_email": true}'::jsonb,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO UPDATE
SET
  updated_at = NOW(),
  status = EXCLUDED.status;

RAISE NOTICE '✅ Order inserted/updated: Order #6817';

-- ============================================================
-- 4. INSERT INVENTORY: 18 Frames (Pending Status)
-- ============================================================

-- Clean up old demo inventory first (to make script re-runnable)
DELETE FROM public.inventory
WHERE account_id = v_demo_account_id;

RAISE NOTICE '🧹 Cleaned up old demo inventory';

-- Insert all 18 frames at once
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES
  -- Frame 1
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_AIR-BLACK', 'B.M.E.C.', 'BIG AIR', 'BLACK', '54', 1, 'pending', '675254228656',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 2
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_BEAT-BLACK_BROWN', 'B.M.E.C.', 'BIG BEAT', 'BLACK/BROWN', '60', 1, 'pending', '675254179613',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 3
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_BOLT-NAVY_FADE', 'B.M.E.C.', 'BIG BOLT', 'NAVY FADE', '58', 1, 'pending', '675254222883',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 4
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_DUDE-RUST_BROWN', 'B.M.E.C.', 'BIG DUDE', 'RUST/BROWN', '57', 1, 'pending', '675254231328',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 5
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_FLOW-NAVY_GUN_NAVY', 'B.M.E.C.', 'BIG FLOW', 'NAVY/GUN/NAVY', '58', 1, 'pending', '675254299588',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 6
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_FRONT-AQUA_BROWN_DEMI', 'B.M.E.C.', 'BIG FRONT', 'AQUA/BROWN DEMI', '57', 1, 'pending', '675254304657',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 7
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'B.M.E.C.-BIG_RIVER-GREY_GUNMETAL', 'B.M.E.C.', 'BIG RIVER', 'GREY/GUNMETAL', '55', 1, 'pending', '675254305487',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 8
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'GB+_COLLECTION-BEAUTIFUL-BLACK_GOLD', 'GB+ COLLECTION', 'BEAUTIFUL', 'BLACK/GOLD', '56', 1, 'pending', '675254228748',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 9
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'GB+_COLLECTION-DETERMINED-TEAL_PINK', 'GB+ COLLECTION', 'DETERMINED', 'TEAL/PINK', '58', 1, 'pending', '675254243062',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 10
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'GB+_COLLECTION-WONDROUS-PINK_CRYST_PK', 'GB+ COLLECTION', 'WONDROUS', 'PINK CRYST/PK', '54', 1, 'pending', '675254313710',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 11
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-CLEO-CLEO_BLACK_CRY', 'MODERN PLASTICS II', 'CLEO', 'CLEO BLACK CRY', '52', 1, 'pending', '675254300505',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 12
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-CONGENIAL-BLUE_PINK_CRYST', 'MODERN PLASTICS II', 'CONGENIAL', 'BLUE/PINK CRYST', '54', 1, 'pending', '675254314236',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 13
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-ESTIMATE-BLACK_BURG_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/BURG CRY', '54', 1, 'pending', '675254321807',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 14
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-ESTIMATE-BLACK_GREY_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/GREY CRY', '54', 1, 'pending', '675254321814',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 15
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-FICTION-BLACK_CRYST_GRY', 'MODERN PLASTICS II', 'FICTION', 'BLACK/CRYST GRY', '53', 1, 'pending', '675254303308',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 16
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-GRADIENT-NAVY_CRYST_BRN', 'MODERN PLASTICS II', 'GRADIENT', 'NAVY CRYST/BRN', '52', 1, 'pending', '675254314342',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 17
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-PATRICK-BLACK', 'MODERN PLASTICS II', 'PATRICK', 'BLACK', '55', 1, 'pending', '675254314656',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW()),

  -- Frame 18
  (gen_random_uuid(), v_demo_account_id, v_vendor_id, v_order_id, NULL,
   'MODERN_PLASTICS_II-PATRICK-CRYSTAL', 'MODERN PLASTICS II', 'PATRICK', 'CRYSTAL', '55', 1, 'pending', '675254314663',
   '{"order_number": "6817", "demo": true}'::jsonb, NOW() - INTERVAL '2 hours', NOW());

RAISE NOTICE '✅ Inventory inserted: 18 frames';

-- ============================================================
-- Verification Summary
-- ============================================================
RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════════════';
RAISE NOTICE '✅ Demo data insert complete!';
RAISE NOTICE '═══════════════════════════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE 'Demo Account ID: %', v_demo_account_id;
RAISE NOTICE 'Demo User Email: demo@opti-profit.internal';
RAISE NOTICE '';
RAISE NOTICE 'Data created:';
RAISE NOTICE '  ✓ 1 Vendor (Modern Optical)';
RAISE NOTICE '  ✓ 1 Email (Order confirmation)';
RAISE NOTICE '  ✓ 1 Order (#6817)';
RAISE NOTICE '  ✓ 18 Inventory items (pending status)';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '  1. Update frontend to remove Supabase Edge Function calls';
RAISE NOTICE '  2. Test demo mode in browser';
RAISE NOTICE '  3. Verify demo data displays correctly';
RAISE NOTICE '';

END $$;

-- Final verification queries
SELECT 'Vendor Check' as check_type, name, is_active
FROM public.vendors
WHERE id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7'::uuid

UNION ALL

SELECT 'Order Check', order_number, status::text
FROM public.orders
WHERE id = '50fa0961-9d44-4190-95ce-b57be229ba62'::uuid

UNION ALL

SELECT 'Inventory Check',
       'Total: ' || COUNT(*)::text,
       'All pending: ' || (COUNT(*) FILTER (WHERE status = 'pending'))::text
FROM public.inventory
WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'::uuid;
