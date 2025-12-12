-- ============================================================
-- Add New Vendor: ClearVision Optical
-- Run this script to add ClearVision to your database
-- ============================================================

-- ============================================================
-- 1. Insert ClearVision Vendor
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
  'f4d5e6f7-a8b9-4c0d-1e2f-a3b4c5d6e7f8', -- ClearVision UUID
  'ClearVision',
  'CLEARVISION',
  'cvoptical.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": ["cvoptical.com", "clearvision.com", "cvogo.com"]
    },
    "tier2": {
      "weight": 85,
      "body_signatures": [
        "clearvision optical",
        "cvoptical.com",
        "cvogo.com",
        "ClearVision Optical Order Reference"
      ]
    },
    "tier3": {
      "weight": 60,
      "body_keywords": [
        "clearvision",
        "cvogo",
        "order reference"
      ],
      "required_matches": 2,
      "subject_keywords": [
        "clearvision",
        "cvogo",
        "new cvogo order"
      ]
    }
  }'::jsonb,
  'ClearVisionParser',
  'https://cvogo.com/api/sku_image/thumbnail', -- Image API endpoint
  NULL,
  true,
  '{
    "brands": [
      "Advantage",
      "Aspire",
      "Dilli Dalli",
      "Jessica McClintock",
      "Izod",
      "Izod Xtreme",
      "Project Runway",
      "OP Ocean Pacific",
      "BD Eyewear"
    ],
    "brand_prefixes": {
      "AD": "Advantage",
      "ADV": "Advantage",
      "ASP": "Aspire",
      "DD": "Dilli Dalli",
      "JMC": "Jessica McClintock",
      "JM": "Jessica McClintock",
      "IZ": "Izod",
      "IZX": "Izod Xtreme",
      "PT": "Project Runway",
      "OP": "OP Ocean Pacific",
      "BD": "BD Eyewear"
    }
  }'::jsonb,
  NOW(),
  NOW(),
  'customerservice@cvoptical.com',
  '1-800-645-3733'
) ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  domain = EXCLUDED.domain,
  email_patterns = EXCLUDED.email_patterns,
  parser_service = EXCLUDED.parser_service,
  api_endpoint = EXCLUDED.api_endpoint,
  settings = EXCLUDED.settings,
  is_active = EXCLUDED.is_active,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  updated_at = NOW();

-- ============================================================
-- 2. Verify vendor was inserted
-- ============================================================
SELECT
  name,
  code,
  domain,
  is_active,
  parser_service,
  email_patterns->'tier1'->'domains' as tier1_domains,
  contact_email,
  contact_phone
FROM public.vendors
WHERE code = 'CLEARVISION';
