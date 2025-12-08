-- ============================================================
-- RLS SECURITY VALIDATION TESTS
-- ============================================================
-- Run these tests to verify RLS is working correctly
-- ============================================================

-- Test 1: Verify auth.uid() works
DO $$
DECLARE
  account_id UUID;
BEGIN
  account_id := auth.uid();
  RAISE NOTICE 'Current user account ID: %', account_id;

  IF account_id IS NULL THEN
    RAISE NOTICE '❌ No authenticated user (expected for service role in SQL editor)';
  ELSE
    RAISE NOTICE '✅ auth.uid() returned account ID';
  END IF;
END $$;

-- Test 2: Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- Test 3: Verify all user-data tables have at least 5 policies
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) >= 5 THEN '✅ Properly secured'
    WHEN COUNT(*) >= 1 THEN '⚠️  Partially secured'
    ELSE '❌ Not secured'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'accounts', 'inventory', 'orders', 'emails',
    'account_brands', 'account_vendors', 'vendor_reps',
    'return_reports', 'bug_reports', 'vendor_requests'
  )
GROUP BY tablename
ORDER BY policy_count ASC;

-- Test 4: Verify RLS is enabled on all tables
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS DISABLED - SECURITY RISK!'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'accounts', 'inventory', 'orders', 'emails',
    'account_brands', 'account_vendors', 'vendor_reps',
    'return_reports', 'return_report_items',
    'bug_reports', 'vendor_requests',
    'vendors', 'brands', 'vendor_catalog',
    'api_logs', 'webhook_logs',
    'demo_data', 'demo_analytics'
  )
ORDER BY tablename;

-- Test 5: Verify service role policies exist
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%service%'
ORDER BY tablename;
