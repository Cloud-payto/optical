-- ============================================================
-- Add New Vendors: Kenmark, Europa, Marchon
-- Run this script to add the new vendors to your database
-- ============================================================

-- ============================================================
-- 1. Insert Kenmark Vendor
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
  'c1a2b3c4-d5e6-4f78-89ab-0c1d2e3f4a5b', -- Kenmark UUID
  'Kenmark',
  'KENMARK',
  'kenmarkeyewear.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": ["kenmarkeyewear.com"]
    },
    "tier2": {
      "weight": 85,
      "body_signatures": [
        "kenmark eyewear",
        "kenmarkeyewear.com",
        "imageserver.jiecosystem.net/image/kenmark/",
        "kenmark"
      ]
    },
    "tier3": {
      "weight": 60,
      "body_keywords": [
        "kenmark",
        "order number",
        "placed by rep"
      ],
      "required_matches": 2,
      "subject_keywords": [
        "kenmark eyewear",
        "kenmark",
        "receipt for order number"
      ]
    }
  }'::jsonb,
  'KenmarkParser',
  'https://kenmarkeyewear.com/US/api/CatalogAPI/filter',
  NULL,
  true,
  '{}'::jsonb,
  NOW(),
  NOW(),
  'noreply@kenmarkeyewear.com',
  NULL
) ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  domain = EXCLUDED.domain,
  email_patterns = EXCLUDED.email_patterns,
  parser_service = EXCLUDED.parser_service,
  api_endpoint = EXCLUDED.api_endpoint,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- 2. Insert Europa Vendor
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
  'd2b3c4d5-e6f7-4a8b-9c0d-e1f2a3b4c5d6', -- Europa UUID
  'Europa',
  'EUROPA',
  'europaeye.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": ["europaeye.com"]
    },
    "tier2": {
      "weight": 85,
      "body_signatures": [
        "europaeye.com",
        "europa",
        "europa sales representative"
      ]
    },
    "tier3": {
      "weight": 60,
      "body_keywords": [
        "europaeye.com",
        "order placed by rep",
        "europa"
      ],
      "required_matches": 2,
      "subject_keywords": [
        "europa",
        "customer receipt",
        "receipt for order"
      ]
    }
  }'::jsonb,
  'EuropaParser',
  NULL,
  NULL,
  true,
  '{}'::jsonb,
  NOW(),
  NOW(),
  'noreply@europaeye.com',
  NULL
) ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  domain = EXCLUDED.domain,
  email_patterns = EXCLUDED.email_patterns,
  parser_service = EXCLUDED.parser_service,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- 3. Insert Marchon Vendor (placeholder - update after email analysis)
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
  'e3c4d5e6-f7a8-4b9c-0d1e-f2a3b4c5d6e7', -- Marchon UUID
  'Marchon',
  'MARCHON',
  'marchon.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": ["marchon.com", "marchoneyewear.com"]
    },
    "tier2": {
      "weight": 85,
      "body_signatures": [
        "marchon",
        "marchon eyewear"
      ]
    },
    "tier3": {
      "weight": 60,
      "body_keywords": [
        "marchon",
        "order"
      ],
      "required_matches": 2,
      "subject_keywords": [
        "marchon",
        "order"
      ]
    }
  }'::jsonb,
  'MarchonParser',
  NULL,
  NULL,
  true,
  '{}'::jsonb,
  NOW(),
  NOW(),
  NULL,
  NULL
) ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  domain = EXCLUDED.domain,
  email_patterns = EXCLUDED.email_patterns,
  parser_service = EXCLUDED.parser_service,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- 4. Verify vendors were inserted
-- ============================================================
SELECT
  name,
  code,
  domain,
  is_active,
  parser_service,
  email_patterns->'tier1'->'domains' as tier1_domains
FROM public.vendors
WHERE code IN ('KENMARK', 'EUROPA', 'MARCHON')
ORDER BY name;
