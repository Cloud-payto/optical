-- ============================================================
-- Fix RLS Policies for Demo Account
-- ============================================================
-- This script adds RLS policies to allow the demo account to
-- read its own inventory, orders, and related data.
-- ============================================================

-- Enable RLS on inventory table (if not already enabled)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INVENTORY TABLE POLICIES
-- ============================================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory;

-- Create policy: Users can view inventory for their account
CREATE POLICY "Users can view their own inventory"
ON public.inventory
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
  OR
  account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'::uuid -- Demo account
);

-- Create policy: Users can insert their own inventory
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory;
CREATE POLICY "Users can insert their own inventory"
ON public.inventory
FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
);

-- Create policy: Users can update their own inventory
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory;
CREATE POLICY "Users can update their own inventory"
ON public.inventory
FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
);

-- Create policy: Users can delete their own inventory
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory;
CREATE POLICY "Users can delete their own inventory"
ON public.inventory
FOR DELETE
USING (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
);

-- ============================================================
-- ORDERS TABLE POLICIES
-- ============================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create policy: Users can view orders for their account
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
  OR
  account_id = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd'::uuid -- Demo account
);

-- Create policy: Users can insert their own orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
);

-- Create policy: Users can update their own orders
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
);

-- Create policy: Users can delete their own orders
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders"
ON public.orders
FOR DELETE
USING (
  account_id IN (
    SELECT id FROM auth.users WHERE auth.uid() = id
  )
);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check that policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('inventory', 'orders')
ORDER BY tablename, policyname;

RAISE NOTICE '';
RAISE NOTICE '✅ RLS policies updated successfully!';
RAISE NOTICE '';
RAISE NOTICE 'Demo account (3251cae7-ee61-4c5f-be4c-4312c17ef4fd) can now:';
RAISE NOTICE '  ✓ Read inventory items';
RAISE NOTICE '  ✓ Read orders';
RAISE NOTICE '';
