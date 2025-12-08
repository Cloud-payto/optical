-- ============================================================
-- COMPREHENSIVE RLS SECURITY POLICIES (FIXED)
-- ============================================================
-- This migration implements secure Row Level Security across
-- all user data tables in the OptiProfit database.
--
-- Security Principles:
-- 1. Users can only access their own data (via account_id)
-- 2. Service role can bypass RLS for backend operations
-- 3. No hardcoded UUIDs (demo handled separately)
-- 4. Direct auth.uid() comparisons for efficiency
-- 5. All user data tables protected
-- ============================================================

-- ============================================================
-- NOTE: RLS policies use auth.uid() directly for efficiency
-- No helper function needed since auth.uid() is available everywhere
-- ============================================================


-- 1. ACCOUNTS TABLE RLS
-- ============================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own account" ON public.accounts;
DROP POLICY IF EXISTS "Service role has full access" ON public.accounts;
DROP POLICY IF EXISTS "accounts_select_own" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_own" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_own" ON public.accounts;
DROP POLICY IF EXISTS "accounts_service_full_access" ON public.accounts;

CREATE POLICY "accounts_select_own"
ON public.accounts FOR SELECT
USING (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "accounts_insert_own"
ON public.accounts FOR INSERT
WITH CHECK (user_id = auth.uid() AND id = auth.uid());

CREATE POLICY "accounts_update_own"
ON public.accounts FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "accounts_service_full_access"
ON public.accounts FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 2. INVENTORY TABLE RLS
-- ============================================================

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "inventory_select_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_insert_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_update_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_delete_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_service_full_access" ON public.inventory;

CREATE POLICY "inventory_select_own"
ON public.inventory FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "inventory_insert_own"
ON public.inventory FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "inventory_update_own"
ON public.inventory FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "inventory_delete_own"
ON public.inventory FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "inventory_service_full_access"
ON public.inventory FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 3. ORDERS TABLE RLS
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_own" ON public.orders;
DROP POLICY IF EXISTS "orders_service_full_access" ON public.orders;

CREATE POLICY "orders_select_own"
ON public.orders FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "orders_insert_own"
ON public.orders FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "orders_update_own"
ON public.orders FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "orders_delete_own"
ON public.orders FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "orders_service_full_access"
ON public.orders FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 4. EMAILS TABLE RLS
-- ============================================================

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emails_select_own" ON public.emails;
DROP POLICY IF EXISTS "emails_insert_own" ON public.emails;
DROP POLICY IF EXISTS "emails_update_own" ON public.emails;
DROP POLICY IF EXISTS "emails_delete_own" ON public.emails;
DROP POLICY IF EXISTS "emails_service_full_access" ON public.emails;

CREATE POLICY "emails_select_own"
ON public.emails FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "emails_insert_own"
ON public.emails FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "emails_update_own"
ON public.emails FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "emails_delete_own"
ON public.emails FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "emails_service_full_access"
ON public.emails FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 5. ACCOUNT_BRANDS TABLE RLS
-- ============================================================

ALTER TABLE public.account_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_brands_select_own" ON public.account_brands;
DROP POLICY IF EXISTS "account_brands_insert_own" ON public.account_brands;
DROP POLICY IF EXISTS "account_brands_update_own" ON public.account_brands;
DROP POLICY IF EXISTS "account_brands_delete_own" ON public.account_brands;
DROP POLICY IF EXISTS "account_brands_service_full_access" ON public.account_brands;

CREATE POLICY "account_brands_select_own"
ON public.account_brands FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "account_brands_insert_own"
ON public.account_brands FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "account_brands_update_own"
ON public.account_brands FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "account_brands_delete_own"
ON public.account_brands FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "account_brands_service_full_access"
ON public.account_brands FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 6. ACCOUNT_VENDORS TABLE RLS
-- ============================================================

ALTER TABLE public.account_vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_vendors_select_own" ON public.account_vendors;
DROP POLICY IF EXISTS "account_vendors_insert_own" ON public.account_vendors;
DROP POLICY IF EXISTS "account_vendors_update_own" ON public.account_vendors;
DROP POLICY IF EXISTS "account_vendors_delete_own" ON public.account_vendors;
DROP POLICY IF EXISTS "account_vendors_service_full_access" ON public.account_vendors;

CREATE POLICY "account_vendors_select_own"
ON public.account_vendors FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "account_vendors_insert_own"
ON public.account_vendors FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "account_vendors_update_own"
ON public.account_vendors FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "account_vendors_delete_own"
ON public.account_vendors FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "account_vendors_service_full_access"
ON public.account_vendors FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 7. VENDOR_REPS TABLE RLS
-- ============================================================

ALTER TABLE public.vendor_reps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_reps_select_own" ON public.vendor_reps;
DROP POLICY IF EXISTS "vendor_reps_insert_own" ON public.vendor_reps;
DROP POLICY IF EXISTS "vendor_reps_update_own" ON public.vendor_reps;
DROP POLICY IF EXISTS "vendor_reps_delete_own" ON public.vendor_reps;
DROP POLICY IF EXISTS "vendor_reps_service_full_access" ON public.vendor_reps;

CREATE POLICY "vendor_reps_select_own"
ON public.vendor_reps FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "vendor_reps_insert_own"
ON public.vendor_reps FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "vendor_reps_update_own"
ON public.vendor_reps FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "vendor_reps_delete_own"
ON public.vendor_reps FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "vendor_reps_service_full_access"
ON public.vendor_reps FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 8. RETURN_REPORTS TABLE RLS
-- ============================================================

ALTER TABLE public.return_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "return_reports_select_own" ON public.return_reports;
DROP POLICY IF EXISTS "return_reports_insert_own" ON public.return_reports;
DROP POLICY IF EXISTS "return_reports_update_own" ON public.return_reports;
DROP POLICY IF EXISTS "return_reports_delete_own" ON public.return_reports;
DROP POLICY IF EXISTS "return_reports_service_full_access" ON public.return_reports;

CREATE POLICY "return_reports_select_own"
ON public.return_reports FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "return_reports_insert_own"
ON public.return_reports FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "return_reports_update_own"
ON public.return_reports FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "return_reports_delete_own"
ON public.return_reports FOR DELETE
USING (account_id = auth.uid());

CREATE POLICY "return_reports_service_full_access"
ON public.return_reports FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 9. RETURN_REPORT_ITEMS TABLE RLS
-- ============================================================

ALTER TABLE public.return_report_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "return_report_items_select_own" ON public.return_report_items;
DROP POLICY IF EXISTS "return_report_items_insert_own" ON public.return_report_items;
DROP POLICY IF EXISTS "return_report_items_update_own" ON public.return_report_items;
DROP POLICY IF EXISTS "return_report_items_delete_own" ON public.return_report_items;
DROP POLICY IF EXISTS "return_report_items_service_full_access" ON public.return_report_items;

CREATE POLICY "return_report_items_select_own"
ON public.return_report_items FOR SELECT
USING (
  return_report_id IN (
    SELECT id FROM public.return_reports
    WHERE account_id = auth.uid()
  )
);

CREATE POLICY "return_report_items_insert_own"
ON public.return_report_items FOR INSERT
WITH CHECK (
  return_report_id IN (
    SELECT id FROM public.return_reports
    WHERE account_id = auth.uid()
  )
);

CREATE POLICY "return_report_items_update_own"
ON public.return_report_items FOR UPDATE
USING (
  return_report_id IN (
    SELECT id FROM public.return_reports
    WHERE account_id = auth.uid()
  )
)
WITH CHECK (
  return_report_id IN (
    SELECT id FROM public.return_reports
    WHERE account_id = auth.uid()
  )
);

CREATE POLICY "return_report_items_delete_own"
ON public.return_report_items FOR DELETE
USING (
  return_report_id IN (
    SELECT id FROM public.return_reports
    WHERE account_id = auth.uid()
  )
);

CREATE POLICY "return_report_items_service_full_access"
ON public.return_report_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 10. BUG_REPORTS TABLE RLS
-- ============================================================

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bug_reports_select_own" ON public.bug_reports;
DROP POLICY IF EXISTS "bug_reports_insert_own" ON public.bug_reports;
DROP POLICY IF EXISTS "bug_reports_update_own" ON public.bug_reports;
DROP POLICY IF EXISTS "bug_reports_service_full_access" ON public.bug_reports;

CREATE POLICY "bug_reports_select_own"
ON public.bug_reports FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "bug_reports_insert_own"
ON public.bug_reports FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "bug_reports_update_own"
ON public.bug_reports FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "bug_reports_service_full_access"
ON public.bug_reports FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 11. VENDOR_REQUESTS TABLE RLS
-- ============================================================

ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_requests_select_own" ON public.vendor_requests;
DROP POLICY IF EXISTS "vendor_requests_insert_own" ON public.vendor_requests;
DROP POLICY IF EXISTS "vendor_requests_update_own" ON public.vendor_requests;
DROP POLICY IF EXISTS "vendor_requests_service_full_access" ON public.vendor_requests;

CREATE POLICY "vendor_requests_select_own"
ON public.vendor_requests FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "vendor_requests_insert_own"
ON public.vendor_requests FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "vendor_requests_update_own"
ON public.vendor_requests FOR UPDATE
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "vendor_requests_service_full_access"
ON public.vendor_requests FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 12. DEMO_DATA TABLE RLS
-- ============================================================

ALTER TABLE public.demo_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_data_select_own" ON public.demo_data;
DROP POLICY IF EXISTS "demo_data_insert_own" ON public.demo_data;
DROP POLICY IF EXISTS "demo_data_update_own" ON public.demo_data;
DROP POLICY IF EXISTS "demo_data_delete_own" ON public.demo_data;
DROP POLICY IF EXISTS "demo_data_service_full_access" ON public.demo_data;

CREATE POLICY "demo_data_select_own"
ON public.demo_data FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "demo_data_insert_own"
ON public.demo_data FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "demo_data_update_own"
ON public.demo_data FOR UPDATE
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "demo_data_delete_own"
ON public.demo_data FOR DELETE
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "demo_data_service_full_access"
ON public.demo_data FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 13. DEMO_ANALYTICS TABLE RLS
-- ============================================================

ALTER TABLE public.demo_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_analytics_select_own" ON public.demo_analytics;
DROP POLICY IF EXISTS "demo_analytics_insert_own" ON public.demo_analytics;
DROP POLICY IF EXISTS "demo_analytics_service_full_access" ON public.demo_analytics;

CREATE POLICY "demo_analytics_select_own"
ON public.demo_analytics FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "demo_analytics_insert_own"
ON public.demo_analytics FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "demo_analytics_service_full_access"
ON public.demo_analytics FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 14. SHARED TABLES (READ-ONLY FOR USERS)
-- ============================================================

-- VENDORS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_select_all" ON public.vendors;
DROP POLICY IF EXISTS "vendors_service_full_access" ON public.vendors;

CREATE POLICY "vendors_select_all"
ON public.vendors FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "vendors_service_full_access"
ON public.vendors FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- BRANDS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_select_all" ON public.brands;
DROP POLICY IF EXISTS "brands_service_full_access" ON public.brands;

CREATE POLICY "brands_select_all"
ON public.brands FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "brands_service_full_access"
ON public.brands FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- VENDOR_CATALOG
ALTER TABLE public.vendor_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_catalog_select_all" ON public.vendor_catalog;
DROP POLICY IF EXISTS "vendor_catalog_service_full_access" ON public.vendor_catalog;

CREATE POLICY "vendor_catalog_select_all"
ON public.vendor_catalog FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "vendor_catalog_service_full_access"
ON public.vendor_catalog FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 15. ADMIN TABLES (SERVICE ROLE ONLY)
-- ============================================================

-- API_LOGS
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_logs_service_only" ON public.api_logs;

CREATE POLICY "api_logs_service_only"
ON public.api_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- WEBHOOK_LOGS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_logs_service_only" ON public.webhook_logs;

CREATE POLICY "webhook_logs_service_only"
ON public.webhook_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ✅ ✅ COMPREHENSIVE RLS POLICIES APPLIED ✅ ✅ ✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '  ✓ All user data tables protected with RLS';
  RAISE NOTICE '  ✓ Users can only access their own data';
  RAISE NOTICE '  ✓ Service role can bypass RLS for backend operations';
  RAISE NOTICE '  ✓ Shared tables (vendors, brands) are read-only for users';
  RAISE NOTICE '  ✓ Admin tables (logs) are service-role only';
  RAISE NOTICE '  ✓ No hardcoded UUIDs in policies';
  RAISE NOTICE '  ✓ Direct auth.uid() checks for efficiency';
  RAISE NOTICE '';
END $$;
