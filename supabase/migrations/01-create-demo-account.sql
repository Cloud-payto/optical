-- ============================================================
-- Step 1: Create Demo Account in accounts table
-- ============================================================
-- Run this AFTER creating the auth user in Supabase UI
-- This creates the corresponding account record
-- ============================================================

INSERT INTO public.accounts (
  id,
  name,
  business_name,
  email,
  phone,
  status,
  subscription_tier,
  created_at,
  updated_at,
  metadata
) VALUES (
  '3251cae7-ee61-4c5f-be4c-4312c17ef4fd', -- Matches auth.users ID
  'Demo Account',
  'OptiProfit Demo Store',
  'demo@opti-profit.internal',
  '555-DEMO-123',
  'active',
  'professional', -- Show premium features
  NOW() - INTERVAL '6 months',
  NOW(),
  '{"is_demo_account": true, "read_only": true, "purpose": "Interactive tours"}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  updated_at = NOW(),
  metadata = EXCLUDED.metadata;

-- Verify account was created
SELECT
  id,
  name,
  email,
  subscription_tier,
  metadata
FROM public.accounts
WHERE id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';
