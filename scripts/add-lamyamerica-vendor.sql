-- Add L'amyamerica vendor with comprehensive email detection patterns
-- This vendor has very unique identifiers making detection highly reliable

INSERT INTO public.vendors (
  name,
  code,
  domain,
  email_patterns,
  parser_service,
  is_active,
  settings
) VALUES (
  'L''amyamerica',
  'lamyamerica',
  'lamyamerica.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": [
        "lamyamerica.com"
      ]
    },
    "tier2": {
      "weight": 90,
      "body_signatures": [
        "L''Amy Logo_Logo.png",
        "L''Amy+Logo_Logo.png",
        "orders@lamyamerica.com",
        "jiecosystem.s3.us-east-1.amazonaws.com/lamy/",
        "EyeRep Order Number"
      ]
    },
    "tier3": {
      "weight": 75,
      "required_matches": 2,
      "subject_keywords": [
        "Your receipt for EyeRep Order Number",
        "EyeRep Order",
        "L''Amy"
      ],
      "body_keywords": [
        "Placed By Rep:",
        "Champion Ophthalmic",
        "jiecosystem",
        "orders@lamyamerica.com",
        "PLEASE DO NOT REPLY TO THIS EMAIL"
      ]
    }
  }'::jsonb,
  'lamyamerica_parser',
  true,
  '{
    "supports_pdf": false,
    "supports_html": true,
    "order_confirmation_format": "html_table"
  }'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  email_patterns = EXCLUDED.email_patterns,
  parser_service = EXCLUDED.parser_service,
  is_active = EXCLUDED.is_active,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the vendor was added
SELECT
  id,
  name,
  code,
  domain,
  email_patterns,
  is_active,
  created_at
FROM public.vendors
WHERE code = 'lamyamerica';
