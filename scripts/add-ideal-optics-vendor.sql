-- Add Ideal Optics vendor with comprehensive email detection patterns
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
  'Ideal Optics',
  'ideal_optics',
  'i-dealoptics.com',
  '{
    "tier1": {
      "weight": 95,
      "domains": [
        "i-dealoptics.com"
      ]
    },
    "tier2": {
      "weight": 90,
      "body_signatures": [
        "I-Deal Optics",
        "i-deal-optics-logo-mail.png",
        "orders@i-dealoptics.com",
        "weborders@i-dealoptics.com"
      ]
    },
    "tier3": {
      "weight": 75,
      "required_matches": 2,
      "subject_keywords": [
        "I-Deal Optics Order Confirmation",
        "I-Deal Optics",
        "Web Order"
      ],
      "body_keywords": [
        "Thank You for Your Order",
        "Web Order #",
        "i-dealoptics.com"
      ]
    }
  }'::jsonb,
  'ideal_optics_parser',
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
WHERE code = 'ideal_optics';
