-- ============================================================
-- OptiProfit Demo Data Insert Script
-- ============================================================
-- This script creates a special demo user and inserts all demo data
-- into the production database tables.
--
-- Demo User ID: 00000000-0000-0000-0000-000000000DEMO
--
-- Tables populated:
-- 1. auth.users (demo user)
-- 2. vendors (Modern Optical)
-- 3. emails (Order #6817 email with parsed_data)
-- 4. orders (Order #6817)
-- 5. inventory (18 frames from the order)
--
-- Usage:
-- Run this in Supabase SQL Editor to populate demo data
-- ============================================================

-- ============================================================
-- 1. Create Demo User in auth.users
-- ============================================================
-- Note: You may need to create this through Supabase Auth UI instead
-- because auth.users might have triggers/constraints

-- If you can insert directly:
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000DEMO',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@optiprofit.com',
  '$2a$10$DEMO_PASSWORD_HASH_NOT_REAL', -- You'll need to set a real password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User","full_name":"OptiProfit Demo User"}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Insert Demo Vendor (Modern Optical)
-- ============================================================
INSERT INTO public.vendors (
  id,
  name,
  code,
  domain,
  email_patterns,
  parser_service,
  api_endpoint,
  api_key_encrypted,
  is_active,
  settings,
  created_at,
  updated_at,
  contact_email,
  contact_phone
) VALUES (
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7', -- Keep same vendor ID for consistency
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
    },
    "tier3": {
      "weight": 60,
      "body_keywords": [
        "custsvc@modernoptical.com",
        "order number",
        "placed by rep"
      ],
      "required_matches": 2,
      "subject_keywords": [
        "modern optical",
        "receipt for order number"
      ]
    }
  }'::jsonb,
  'ModernOpticalParser',
  NULL,
  NULL,
  true,
  '{}'::jsonb,
  NOW(),
  NOW(),
  'custsvc@modernoptical.com',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Insert Demo Email (Order #6817)
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
  'dda6c11f-59b3-426c-88d0-a300b79e2dab', -- Keep same email ID
  '00000000-0000-0000-0000-000000000DEMO', -- Demo user ID
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7', -- Modern Optical vendor ID
  'demo-modern-optical-6817@system.local',
  'Modern Optical Orders <noreply@modernoptical.com>',
  'demo@optiprofit.com',
  'Your Receipt for Order Number 6817',
  NOW() - INTERVAL '1 hour', -- Received 1 hour ago
  '{"source":"demo","timestamp":"' || NOW()::text || '"}'::jsonb,
  E'From: Amro Habib <amrohabib@yahoo.com>
Sent: Friday, September 5, 2025 12:08 PM
To: Payton Millet <pmillet@modernoptical.com>
Subject: Fwd: Your Receipt for Order Number 6817

Sent from my iPhone

Begin forwarded message:
From: noreply@modernoptical.com
Date: September 5, 2025 at 11:07:20 AM MST
To: amrohabib@yahoo.com
Subject: Your Receipt for Order Number 6817

PLEASE DO NOT REPLY TO THIS EMAIL
If you have questions or need to comment on an order, send email to custsvc@modernoptical.com

Order
Order Number: 6817
Placed By Rep: Payton Millet
Date: 9/5/2025
PO/Reference:

Customer
MARANA EYE CARE (93277)
4340 W INA RD
TUCSON , AZ 85741-2232
Phone: 520-833-6337

Ship To
MARANA EYE CARE
4340 W INA RD
TUCSON, AZ 85741-2232

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
  '<html><!-- Full HTML omitted for brevity --></html>',
  0,
  0.00,
  'n8n',
  'parsed',
  '{
    "items": [
      {
        "sku": "B.M.E.C.-BIG_AIR-BLACK",
        "upc": "675254228656",
        "size": "54",
        "brand": "B.M.E.C.",
        "color": "BLACK",
        "model": "BIG AIR",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "French Comotech Spring Hinge, Handmade Acetate, Keyhole Bridge, Metal Trim",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG AIR",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "B.M.E.C.-BIG_BEAT-BLACK_BROWN",
        "upc": "675254179613",
        "size": "60",
        "brand": "B.M.E.C.",
        "color": "BLACK/BROWN",
        "model": "BIG BEAT",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "French Comotech Spring Hinge, Handmade Acetate",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG BEAT",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black/Brown",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "B.M.E.C.-BIG_BOLT-NAVY_FADE",
        "upc": "675254222883",
        "size": "58",
        "brand": "B.M.E.C.",
        "color": "NAVY FADE",
        "model": "BIG BOLT",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "French Comotech Spring Hinge, Handmade Acetate, Keyhole Bridge",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG BOLT",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Navy Fade",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "B.M.E.C.-BIG_DUDE-RUST_BROWN",
        "upc": "675254231328",
        "size": "57",
        "brand": "B.M.E.C.",
        "color": "RUST/BROWN",
        "model": "BIG DUDE",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "French Comotech Spring Hinge, Handmade Acetate",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG DUDE",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Rust/Brown",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "B.M.E.C.-BIG_FLOW-NAVY_GUN_NAVY",
        "upc": "675254299588",
        "size": "58",
        "brand": "B.M.E.C.",
        "color": "NAVY/GUN/NAVY",
        "model": "BIG FLOW",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Stainless Steel. Handmade Zyl Temples",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG FLOW",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Navy/Gunmetal/Navy",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "B.M.E.C.-BIG_FRONT-AQUA_BROWN_DEMI",
        "upc": "675254304657",
        "size": "57",
        "brand": "B.M.E.C.",
        "color": "AQUA/BROWN DEMI",
        "model": "BIG FRONT",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Handmade Zyl",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG FRONT",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Aqua/Brown",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "B.M.E.C.-BIG_RIVER-GREY_GUNMETAL",
        "upc": "675254305487",
        "size": "55",
        "brand": "B.M.E.C.",
        "color": "GREY/GUNMETAL",
        "model": "BIG RIVER",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Handmade Zyl. Stainless Steel temples",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "B.M.E.C.-BIG RIVER",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Grey/Gunmetal",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "GB+_COLLECTION-BEAUTIFUL-BLACK_GOLD",
        "upc": "675254228748",
        "size": "56",
        "brand": "GB+ COLLECTION",
        "color": "BLACK/GOLD",
        "model": "BEAUTIFUL",
        "gender": "female",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "French Comotech Spring Hinge, Handmade Acetate Temples, Silicone Pads, Stainless Steel",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "GB+ COLLECTION-BEAUTIFUL",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black/Gold",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "GB+_COLLECTION-DETERMINED-TEAL_PINK",
        "upc": "675254243062",
        "size": "58",
        "brand": "GB+ COLLECTION",
        "color": "TEAL/PINK",
        "model": "DETERMINED",
        "gender": "female",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "French Comotech Spring Hinge, Handmade Acetate, Metal Trim",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "GB+ COLLECTION-DETERMINED",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Teal/Pink",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "GB+_COLLECTION-WONDROUS-PINK_CRYST_PK",
        "upc": "675254313710",
        "size": "54",
        "brand": "GB+ COLLECTION",
        "color": "PINK CRYST/PK",
        "model": "WONDROUS",
        "gender": "female",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Handmade acetate",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "GB+ COLLECTION-WONDROUS",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Pink/Pink",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-CLEO-CLEO_BLACK_CRY",
        "upc": "675254300505",
        "size": "52",
        "brand": "MODERN PLASTICS II",
        "color": "CLEO BLACK CRY",
        "model": "CLEO",
        "gender": "female",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Plastic",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-CLEO",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Cleo Black Crystal",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-CONGENIAL-BLUE_PINK_CRYST",
        "upc": "675254314236",
        "size": "54",
        "brand": "MODERN PLASTICS II",
        "color": "BLUE/PINK CRYST",
        "model": "CONGENIAL",
        "gender": "female",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Plastic",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-CONGENIAL",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Blue/Pink",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-ESTIMATE-BLACK_BURG_CRY",
        "upc": "675254321807",
        "size": "54",
        "brand": "MODERN PLASTICS II",
        "color": "BLACK/BURG CRY",
        "model": "ESTIMATE",
        "gender": "unisex",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "PLASTIC",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-ESTIMATE",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black/Burgundy",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-ESTIMATE-BLACK_GREY_CRY",
        "upc": "675254321814",
        "size": "54",
        "brand": "MODERN PLASTICS II",
        "color": "BLACK/GREY CRY",
        "model": "ESTIMATE",
        "gender": "unisex",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "PLASTIC",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-ESTIMATE",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black/Grey",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-FICTION-BLACK_CRYST_GRY",
        "upc": "675254303308",
        "size": "53",
        "brand": "MODERN PLASTICS II",
        "color": "BLACK/CRYST GRY",
        "model": "FICTION",
        "gender": "unisex",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Plastic",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-FICTION",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black/Crystal",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-GRADIENT-NAVY_CRYST_BRN",
        "upc": "675254314342",
        "size": "52",
        "brand": "MODERN PLASTICS II",
        "color": "NAVY CRYST/BRN",
        "model": "GRADIENT",
        "gender": "female",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Plastic",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-GRADIENT",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Navy/Brown",
        "confidence_score": 70,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-PATRICK-BLACK",
        "upc": "675254314656",
        "size": "55",
        "brand": "MODERN PLASTICS II",
        "color": "BLACK",
        "model": "PATRICK",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Plastic",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-PATRICK",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Black",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      },
      {
        "sku": "MODERN_PLASTICS_II-PATRICK-CRYSTAL",
        "upc": "675254314663",
        "size": "55",
        "brand": "MODERN PLASTICS II",
        "color": "CRYSTAL",
        "model": "PATRICK",
        "gender": "male",
        "status": "pending",
        "vendor": "Modern Optical",
        "material": "Plastic",
        "quantity": 1,
        "in_stock": true,
        "frame_id": "MODERN PLASTICS II-PATRICK",
        "api_verified": true,
        "order_number": "6817",
        "color_normalized": "Crystal",
        "confidence_score": 100,
        "validation_reason": "Vendor catalog match"
      }
    ]
  }'::jsonb,
  NULL,
  false,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Insert Demo Order (Order #6817)
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
  '50fa0961-9d44-4190-95ce-b57be229ba62', -- Keep same order ID
  '00000000-0000-0000-0000-000000000DEMO', -- Demo user ID
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7', -- Modern Optical vendor ID
  'dda6c11f-59b3-426c-88d0-a300b79e2dab', -- Email ID
  '6817',
  NULL,
  '93277',
  'MARANA EYE CARE',
  NULL,
  '520-833-6337',
  'Payton Millet',
  '2025-09-05',
  18,
  NULL,
  'pending',
  NULL,
  NULL,
  NULL,
  '{}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Insert Demo Inventory (18 Frames)
-- ============================================================

-- Frame 1: B.M.E.C. - BIG AIR
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_AIR-BLACK', 'B.M.E.C.', 'BIG AIR', 'BLACK', '54', 1, 'pending', '675254228656',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 2: B.M.E.C. - BIG BEAT
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_BEAT-BLACK_BROWN', 'B.M.E.C.', 'BIG BEAT', 'BLACK/BROWN', '60', 1, 'pending', '675254179613',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 3: B.M.E.C. - BIG BOLT
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_BOLT-NAVY_FADE', 'B.M.E.C.', 'BIG BOLT', 'NAVY FADE', '58', 1, 'pending', '675254222883',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 4: B.M.E.C. - BIG DUDE
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_DUDE-RUST_BROWN', 'B.M.E.C.', 'BIG DUDE', 'RUST/BROWN', '57', 1, 'pending', '675254231328',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 5: B.M.E.C. - BIG FLOW
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_FLOW-NAVY_GUN_NAVY', 'B.M.E.C.', 'BIG FLOW', 'NAVY/GUN/NAVY', '58', 1, 'pending', '675254299588',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 6: B.M.E.C. - BIG FRONT
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_FRONT-AQUA_BROWN_DEMI', 'B.M.E.C.', 'BIG FRONT', 'AQUA/BROWN DEMI', '57', 1, 'pending', '675254304657',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 7: B.M.E.C. - BIG RIVER
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'B.M.E.C.-BIG_RIVER-GREY_GUNMETAL', 'B.M.E.C.', 'BIG RIVER', 'GREY/GUNMETAL', '55', 1, 'pending', '675254305487',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 8: GB+ COLLECTION - BEAUTIFUL
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'GB+_COLLECTION-BEAUTIFUL-BLACK_GOLD', 'GB+ COLLECTION', 'BEAUTIFUL', 'BLACK/GOLD', '56', 1, 'pending', '675254228748',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 9: GB+ COLLECTION - DETERMINED
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'GB+_COLLECTION-DETERMINED-TEAL_PINK', 'GB+ COLLECTION', 'DETERMINED', 'TEAL/PINK', '58', 1, 'pending', '675254243062',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 10: GB+ COLLECTION - WONDROUS
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'GB+_COLLECTION-WONDROUS-PINK_CRYST_PK', 'GB+ COLLECTION', 'WONDROUS', 'PINK CRYST/PK', '54', 1, 'pending', '675254313710',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 11: MODERN PLASTICS II - CLEO
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-CLEO-CLEO_BLACK_CRY', 'MODERN PLASTICS II', 'CLEO', 'CLEO BLACK CRY', '52', 1, 'pending', '675254300505',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 12: MODERN PLASTICS II - CONGENIAL
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-CONGENIAL-BLUE_PINK_CRYST', 'MODERN PLASTICS II', 'CONGENIAL', 'BLUE/PINK CRYST', '54', 1, 'pending', '675254314236',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 13: MODERN PLASTICS II - ESTIMATE (BLACK/BURG)
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-ESTIMATE-BLACK_BURG_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/BURG CRY', '54', 1, 'pending', '675254321807',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 14: MODERN PLASTICS II - ESTIMATE (BLACK/GREY)
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-ESTIMATE-BLACK_GREY_CRY', 'MODERN PLASTICS II', 'ESTIMATE', 'BLACK/GREY CRY', '54', 1, 'pending', '675254321814',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 15: MODERN PLASTICS II - FICTION
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-FICTION-BLACK_CRYST_GRY', 'MODERN PLASTICS II', 'FICTION', 'BLACK/CRYST GRY', '53', 1, 'pending', '675254303308',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 16: MODERN PLASTICS II - GRADIENT
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-GRADIENT-NAVY_CRYST_BRN', 'MODERN PLASTICS II', 'GRADIENT', 'NAVY CRYST/BRN', '52', 1, 'pending', '675254314342',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 17: MODERN PLASTICS II - PATRICK (BLACK)
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-PATRICK-BLACK', 'MODERN PLASTICS II', 'PATRICK', 'BLACK', '55', 1, 'pending', '675254314656',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- Frame 18: MODERN PLASTICS II - PATRICK (CRYSTAL)
INSERT INTO public.inventory (
  id, account_id, vendor_id, order_id, email_id,
  sku, brand, model, color, size, quantity, status, upc,
  enriched_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000DEMO',
  'f1d2aaf8-1877-4579-9ed0-083541dae7e7',
  '50fa0961-9d44-4190-95ce-b57be229ba62',
  NULL,
  'MODERN_PLASTICS_II-PATRICK-CRYSTAL', 'MODERN PLASTICS II', 'PATRICK', 'CRYSTAL', '55', 1, 'pending', '675254314663',
  '{"order": {"vendor": "Modern Optical", "rep_name": "Payton Millet", "order_date": "9/5/2025", "order_number": "6817", "parse_status": "parsed", "total_pieces": 18, "customer_name": "MARANA EYE CARE", "account_number": "93277"}, "order_number": "6817"}'::jsonb,
  NOW(), NOW()
);

-- ============================================================
-- Verification Queries
-- ============================================================
-- Run these to verify the data was inserted correctly:

-- Check demo user
-- SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000DEMO';

-- Check vendor
-- SELECT id, name FROM vendors WHERE id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7';

-- Check email
-- SELECT id, subject, parse_status FROM emails WHERE account_id = '00000000-0000-0000-0000-000000000DEMO';

-- Check order
-- SELECT id, order_number, total_pieces, status FROM orders WHERE account_id = '00000000-0000-0000-0000-000000000DEMO';

-- Check inventory count
-- SELECT COUNT(*) as total_frames FROM inventory WHERE account_id = '00000000-0000-0000-0000-000000000DEMO';

-- Check inventory details
-- SELECT brand, model, color, size, status FROM inventory WHERE account_id = '00000000-0000-0000-0000-000000000DEMO' ORDER BY brand, model;

-- ============================================================
-- Cleanup Script (if needed)
-- ============================================================
-- Use this to remove all demo data:
--
-- DELETE FROM inventory WHERE account_id = '00000000-0000-0000-0000-000000000DEMO';
-- DELETE FROM orders WHERE account_id = '00000000-0000-0000-0000-000000000DEMO';
-- DELETE FROM emails WHERE account_id = '00000000-0000-0000-0000-000000000DEMO';
-- DELETE FROM vendors WHERE id = 'f1d2aaf8-1877-4579-9ed0-083541dae7e7';
-- DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000DEMO';
