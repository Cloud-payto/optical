-- ============================================================================
-- OptiProfit Demo Data - Complete Setup Script
-- ============================================================================
-- This script is IDEMPOTENT - safe to run multiple times
-- It will clean up existing demo data and insert fresh data
-- ============================================================================

-- STEP 1: Clean up any existing demo data
-- ============================================================================
-- NOTE: Only deletes demo user's data, preserves vendor/brands if they exist elsewhere
BEGIN;

-- Delete in correct order (respecting foreign keys)
DELETE FROM public.inventory WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM public.account_brands WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM public.account_vendors WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM public.orders WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
DELETE FROM public.emails WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';

-- DON'T delete vendor or brands - they might be used by other users

COMMIT;

-- STEP 2: Insert Vendor (or update if exists)
-- ============================================================================
INSERT INTO public.vendors (
  id,
  name,
  code,
  domain,
  email_patterns,
  parser_service,
  is_active
) VALUES (
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  'Modern Optical',
  'MODERN',
  'modernoptical.com',
  '{
    "tier1": {
      "patterns": [
        "order.*confirmation",
        "invoice.*\\d+",
        "receipt.*order"
      ],
      "required_fields": ["order_number", "items"]
    },
    "tier2": {
      "patterns": ["shipping.*notification", "order.*update"],
      "required_fields": ["order_number"]
    },
    "tier3": {
      "patterns": [".*optical.*", ".*frames.*"],
      "required_fields": []
    }
  }'::jsonb,
  'modern_optical',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  domain = EXCLUDED.domain,
  email_patterns = EXCLUDED.email_patterns,
  parser_service = EXCLUDED.parser_service,
  is_active = EXCLUDED.is_active;

-- STEP 3: Insert Brands (or update if exists)
-- ============================================================================
INSERT INTO public.brands (
  id,
  name,
  vendor_id,
  category,
  tier,
  wholesale_cost,
  msrp,
  entry_level_discount,
  is_active
) VALUES
  (
    'b1d2aaf8-0001-0000-0000-000000000001',
    'B.M.E.C.',
    'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
    'Men''s Frames',
    'standard',
    85.00,
    150.00,
    35.00,
    true
  ),
  (
    'b1d2aaf8-0002-0000-0000-000000000002',
    'GB+ COLLECTION',
    'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
    'Women''s Frames',
    'premium',
    75.00,
    140.00,
    40.00,
    true
  ),
  (
    'b1d2aaf8-0003-0000-0000-000000000003',
    'MODERN PLASTICS II',
    'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
    'Unisex Frames',
    'standard',
    65.00,
    120.00,
    45.00,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  vendor_id = EXCLUDED.vendor_id,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  wholesale_cost = EXCLUDED.wholesale_cost,
  msrp = EXCLUDED.msrp,
  entry_level_discount = EXCLUDED.entry_level_discount,
  is_active = EXCLUDED.is_active;

-- STEP 4: Link Demo User to Vendor
-- ============================================================================
INSERT INTO public.account_vendors (
  id,
  account_id,
  vendor_id,
  vendor_account_number,
  notes
) VALUES (
  'av-demo-0001-0000-0000-000000000001',
  '3251cae7-ee61-4c5f-be4c-4312c17ef4fd',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '93277',
  'Demo vendor relationship - Modern Optical'
)
ON CONFLICT (id) DO UPDATE SET
  vendor_account_number = EXCLUDED.vendor_account_number,
  notes = EXCLUDED.notes;

-- STEP 5: Link Demo User to Brands with Pricing
-- ============================================================================
INSERT INTO public.account_brands (
  id,
  account_id,
  vendor_id,
  brand_id,
  discount_percentage,
  wholesale_cost,
  vendor_account_number,
  is_active
) VALUES
  (
    'ab-demo-0001-0000-0000-000000000001',
    '3251cae7-ee61-4c5f-be4c-4312c17ef4fd',
    'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
    'b1d2aaf8-0001-0000-0000-000000000001', -- B.M.E.C.
    35.00,
    55.25, -- $85 - 35% = $55.25
    '93277',
    true
  ),
  (
    'ab-demo-0002-0000-0000-000000000002',
    '3251cae7-ee61-4c5f-be4c-4312c17ef4fd',
    'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
    'b1d2aaf8-0002-0000-0000-000000000002', -- GB+ COLLECTION
    40.00,
    45.00, -- $75 - 40% = $45
    '93277',
    true
  ),
  (
    'ab-demo-0003-0000-0000-000000000003',
    '3251cae7-ee61-4c5f-be4c-4312c17ef4fd',
    'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
    'b1d2aaf8-0003-0000-0000-000000000003', -- MODERN PLASTICS II
    45.00,
    35.75, -- $65 - 45% = $35.75
    '93277',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  discount_percentage = EXCLUDED.discount_percentage,
  wholesale_cost = EXCLUDED.wholesale_cost,
  vendor_account_number = EXCLUDED.vendor_account_number,
  is_active = EXCLUDED.is_active;

-- STEP 6: Insert Email
-- ============================================================================
INSERT INTO public.emails (
  id,
  account_id,
  vendor_id,
  subject,
  from_email,
  to_email,
  received_at,
  body_text,
  body_html,
  parse_status,
  parsed_data,
  raw_data
) VALUES (
  'dda6c11f-59b3-426c-88d0-a300b79e2dab',
  '3251cae7-ee61-4c5f-be4c-4312c17ef4fd',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  'Your Receipt for Order Number 6817',
  'orders@modernoptical.com',
  'demo@optiprofit.com',
  '2025-09-05 10:30:00+00',
  'Thank you for your order from Modern Optical...',
  '<html><body>Thank you for your order from Modern Optical...</body></html>',
  'parsed',
  '{
    "items": [
      {"sku": "B.M.E.C.-BIG_AIR-BLACK", "upc": "675254228656", "size": "54", "brand": "B.M.E.C.", "color": "BLACK", "model": "BIG AIR", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "French Comotech Spring Hinge, Handmade Acetate, Keyhole Bridge, Metal Trim", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG AIR", "api_verified": true, "order_number": "6817", "color_normalized": "Black", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "B.M.E.C.-BIG_BEAT-BLACK_BROWN", "upc": "675254179613", "size": "60", "brand": "B.M.E.C.", "color": "BLACK/BROWN", "model": "BIG BEAT", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "French Comotech Spring Hinge, Handmade Acetate", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG BEAT", "api_verified": true, "order_number": "6817", "color_normalized": "Black/Brown", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "B.M.E.C.-BIG_BOLT-NAVY_FADE", "upc": "675254222883", "size": "58", "brand": "B.M.E.C.", "color": "NAVY FADE", "model": "BIG BOLT", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "French Comotech Spring Hinge, Handmade Acetate, Keyhole Bridge", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG BOLT", "api_verified": true, "order_number": "6817", "color_normalized": "Navy Fade", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "B.M.E.C.-BIG_DUDE-RUST_BROWN", "upc": "675254231328", "size": "57", "brand": "B.M.E.C.", "color": "RUST/BROWN", "model": "BIG DUDE", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "French Comotech Spring Hinge, Handmade Acetate", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG DUDE", "api_verified": true, "order_number": "6817", "color_normalized": "Rust/Brown", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "B.M.E.C.-BIG_FLOW-NAVY_GUN_NAVY", "upc": "675254299588", "size": "58", "brand": "B.M.E.C.", "color": "NAVY/GUN/NAVY", "model": "BIG FLOW", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "Stainless Steel. Handmade Zyl Temples", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG FLOW", "api_verified": true, "order_number": "6817", "color_normalized": "Navy/Gunmetal/Navy", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "B.M.E.C.-BIG_FRONT-AQUA_BROWN_DEMI", "upc": "675254304657", "size": "57", "brand": "B.M.E.C.", "color": "AQUA/BROWN DEMI", "model": "BIG FRONT", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "Handmade Zyl", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG FRONT", "api_verified": true, "order_number": "6817", "color_normalized": "Aqua/Brown", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "B.M.E.C.-BIG_RIVER-GREY_GUNMETAL", "upc": "675254305487", "size": "55", "brand": "B.M.E.C.", "color": "GREY/GUNMETAL", "model": "BIG RIVER", "gender": "male", "status": "pending", "vendor": "Modern Optical", "material": "Handmade Zyl. Stainless Steel temples", "quantity": 1, "in_stock": true, "frame_id": "B.M.E.C.-BIG RIVER", "api_verified": true, "order_number": "6817", "color_normalized": "Grey/Gunmetal", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "GB+_COLLECTION-BEAUTIFUL-BLACK_GOLD", "upc": "675254228748", "size": "56", "brand": "GB+ COLLECTION", "color": "BLACK/GOLD", "model": "BEAUTIFUL", "gender": "female", "status": "pending", "vendor": "Modern Optical", "material": "French Comotech Spring Hinge, Handmade Acetate Temples, Silicone Pads, Stainless Steel", "quantity": 1, "in_stock": true, "frame_id": "GB+ COLLECTION-BEAUTIFUL", "api_verified": true, "order_number": "6817", "color_normalized": "Black/Gold", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "GB+_COLLECTION-DETERMINED-TEAL_PINK", "upc": "675254243062", "size": "58", "brand": "GB+ COLLECTION", "color": "TEAL/PINK", "model": "DETERMINED", "gender": "female", "status": "pending", "vendor": "Modern Optical", "material": "French Comotech Spring Hinge, Handmade Acetate, Metal Trim", "quantity": 1, "in_stock": true, "frame_id": "GB+ COLLECTION-DETERMINED", "api_verified": true, "order_number": "6817", "color_normalized": "Teal/Pink", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "GB+_COLLECTION-WONDROUS-PINK_CRYST_PK", "upc": "675254313710", "size": "54", "brand": "GB+ COLLECTION", "color": "PINK CRYST/PK", "model": "WONDROUS", "gender": "female", "status": "pending", "vendor": "Modern Optical", "material": "Handmade acetate", "quantity": 1, "in_stock": true, "frame_id": "GB+ COLLECTION-WONDROUS", "api_verified": true, "order_number": "6817", "color_normalized": "Pink/Pink", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-CLEO-CLEO_BLACK_CRY", "upc": "675254300505", "size": "52", "brand": "MODERN PLASTICS II", "color": "CLEO BLACK CRY", "model": "CLEO", "gender": "female", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-CLEO", "api_verified": true, "order_number": "6817", "color_normalized": "Cleo Black Crystal", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-CONGENIAL-BLUE_PINK_CRYST", "upc": "675254314236", "size": "54", "brand": "MODERN PLASTICS II", "color": "BLUE/PINK CRYST", "model": "CONGENIAL", "gender": "female", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-CONGENIAL", "api_verified": true, "order_number": "6817", "color_normalized": "Blue/Pink", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-ESTIMATE-BLACK_BURG_CRY", "upc": "675254321807", "size": "54", "brand": "MODERN PLASTICS II", "color": "BLACK/BURG CRY", "model": "ESTIMATE", "gender": "unisex", "status": "pending", "vendor": "Modern Optical", "material": "PLASTIC", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-ESTIMATE", "api_verified": true, "order_number": "6817", "color_normalized": "Black/Burgundy", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-ESTIMATE-BLACK_GREY_CRY", "upc": "675254321807", "size": "54", "brand": "MODERN PLASTICS II", "color": "BLACK/GREY CRY", "model": "ESTIMATE", "gender": "unisex", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-ESTIMATE", "api_verified": true, "order_number": "6817", "color_normalized": "Black/Grey", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-FICTION-BLACK_CRYST_GRY", "upc": "675254322378", "size": "55", "brand": "MODERN PLASTICS II", "color": "BLACK CRYST/GRY", "model": "FICTION", "gender": "unisex", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-FICTION", "api_verified": true, "order_number": "6817", "color_normalized": "Black/Grey", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-GRADIENT-NAVY_CRYST_BRN", "upc": "675254326307", "size": "54", "brand": "MODERN PLASTICS II", "color": "NAVY CRYST/BRN", "model": "GRADIENT", "gender": "unisex", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-GRADIENT", "api_verified": true, "order_number": "6817", "color_normalized": "Navy/Brown", "confidence_score": 70, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-PATRICK-BLACK", "upc": "675254327403", "size": "54", "brand": "MODERN PLASTICS II", "color": "BLACK", "model": "PATRICK", "gender": "unisex", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-PATRICK", "api_verified": true, "order_number": "6817", "color_normalized": "Black", "confidence_score": 100, "validation_reason": "Vendor catalog match"},
      {"sku": "MODERN_PLASTICS_II-PATRICK-CRYSTAL", "upc": "675254327410", "size": "54", "brand": "MODERN PLASTICS II", "color": "CRYSTAL", "model": "PATRICK", "gender": "unisex", "status": "pending", "vendor": "Modern Optical", "material": "Plastic", "quantity": 1, "in_stock": true, "frame_id": "MODERN PLASTICS II-PATRICK", "api_verified": true, "order_number": "6817", "color_normalized": "Crystal", "confidence_score": 100, "validation_reason": "Vendor catalog match"}
    ],
    "vendor": "Modern Optical",
    "customer": "MARANA EYE CARE",
    "order_number": "6817",
    "order_date": "2025-09-05",
    "account_number": "93277",
    "total_pieces": 18,
    "rep_name": "Payton Millet"
  }'::jsonb,
  jsonb_build_object('source', 'demo', 'timestamp', NOW()::text)
)
ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  parse_status = EXCLUDED.parse_status,
  parsed_data = EXCLUDED.parsed_data;

-- STEP 7: Insert Order
-- ============================================================================
INSERT INTO public.orders (
  id,
  account_id,
  vendor_id,
  email_id,
  order_number,
  order_date,
  total_pieces,
  customer_name,
  account_number,
  status,
  rep_name
) VALUES (
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  '3251cae7-ee61-4c5f-be4c-4312c17ef4fd',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  'dda6c11f-59b3-426c-88d0-a300b79e2dab',
  '6817',
  '2025-09-05',
  18,
  'MARANA EYE CARE',
  '93277',
  'pending',
  'Payton Millet'
)
ON CONFLICT (id) DO UPDATE SET
  order_date = EXCLUDED.order_date,
  total_pieces = EXCLUDED.total_pieces,
  customer_name = EXCLUDED.customer_name,
  status = EXCLUDED.status;

-- STEP 8: Insert Inventory (18 frames)
-- ============================================================================
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, sku, brand, model, color, size, status, upc
) VALUES
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_AIR-BLACK', 'B.M.E.C.', 'BIG AIR', 'BLACK', '54', 'pending', '675254228656'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_BEAT-BLACK_BROWN', 'B.M.E.C.', 'BIG BEAT', 'BLACK/BROWN', '60', 'pending', '675254179613'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_BOLT-NAVY_FADE', 'B.M.E.C.', 'BIG BOLT', 'NAVY FADE', '58', 'pending', '675254222883'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_DUDE-RUST_BROWN', 'B.M.E.C.', 'BIG DUDE', 'RUST/BROWN', '57', 'pending', '675254231328'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_FLOW-NAVY_GUN_NAVY', 'B.M.E.C.', 'BIG FLOW', 'NAVY/GUN/NAVY', '58', 'pending', '675254299588'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_FRONT-AQUA_BROWN_DEMI', 'B.M.E.C.', 'BIG FRONT', 'AQUA/BROWN DEMI', '57', 'pending', '675254304657'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'B.M.E.C.-BIG_RIVER-GREY_GUNMETAL', 'B.M.E.C.', 'BIG RIVER', 'GREY/GUNMETAL', '55', 'pending', '675254305487'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'GB+_COLLECTION-BEAUTIFUL-BLACK_GOLD', 'GB+ COLLECTION', 'BEAUTIFUL', 'BLACK/GOLD', '56', 'pending', '675254228748'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'GB+_COLLECTION-DETERMINED-TEAL_PINK', 'GB+ COLLECTION', 'DETERMINED', 'TEAL/PINK', '58', 'pending', '675254243062'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'GB+_COLLECTION-WONDROUS-PINK_CRYST_PK', 'GB+ COLLECTION', 'WONDROUS', 'PINK CRYST/PK', '54', 'pending', '675254313710'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-CLEO-CLEO_BLACK_CRY', 'MODERN PLASTICS II', 'CLEO', 'CLEO BLACK CRY', '52', 'pending', '675254300505'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-CONGENIAL-BLUE_PINK_CRYST', 'MODERN PLASTICS II', 'CONGENIAL', 'BLUE/PINK CRYST', '54', 'pending', '675254314236'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-ESTIMATE-BLACK_BURG_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/BURG CRY', '54', 'pending', '675254321807'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-ESTIMATE-BLACK_GREY_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/GREY CRY', '54', 'pending', '675254321807'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-FICTION-BLACK_CRYST_GRY', 'MODERN PLASTICS II', 'FICTION', 'BLACK CRYST/GRY', '55', 'pending', '675254322378'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-GRADIENT-NAVY_CRYST_BRN', 'MODERN PLASTICS II', 'GRADIENT', 'NAVY CRYST/BRN', '54', 'pending', '675254326307'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-PATRICK-BLACK', 'MODERN PLASTICS II', 'PATRICK', 'BLACK', '54', 'pending', '675254327403'),
  (gen_random_uuid(), '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', '50fa0961-9d44-4190-95ce-b57be229ba62', 'MODERN_PLASTICS_II-PATRICK-CRYSTAL', 'MODERN PLASTICS II', 'PATRICK', 'CRYSTAL', '54', 'pending', '675254327410');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all data was inserted correctly:
--
-- SELECT
--   'Demo User' as check_name, COUNT(*) as count
-- FROM auth.users
-- WHERE id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
-- UNION ALL
-- SELECT 'Vendor', COUNT(*) FROM public.vendors WHERE id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7'
-- UNION ALL
-- SELECT 'Brands', COUNT(*) FROM public.brands WHERE vendor_id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7'
-- UNION ALL
-- SELECT 'Account-Vendor Link', COUNT(*) FROM public.account_vendors WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
-- UNION ALL
-- SELECT 'Account-Brand Links', COUNT(*) FROM public.account_brands WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
-- UNION ALL
-- SELECT 'Email', COUNT(*) FROM public.emails WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
-- UNION ALL
-- SELECT 'Order', COUNT(*) FROM public.orders WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'
-- UNION ALL
-- SELECT 'Inventory', COUNT(*) FROM public.inventory WHERE account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
--
-- Expected results:
-- Demo User: 1
-- Vendor: 1
-- Brands: 3
-- Account-Vendor Link: 1
-- Account-Brand Links: 3
-- Email: 1
-- Order: 1
-- Inventory: 18
