-- ============================================
-- Feedback System Database Tables
-- Created: 2025
-- Purpose: Bug reports and vendor requests
-- ============================================

-- Description:
-- This script creates two new tables for the OptiProfit feedback system:
-- 1. bug_reports - Stores user-submitted bug reports
-- 2. vendor_requests - Stores user requests for new vendors to be added

-- Instructions:
-- 1. Log in to your Supabase dashboard: https://supabase.com/dashboard
-- 2. Navigate to your project: https://supabase.com/dashboard/project/bllrhafpqvzqahwxauzg
-- 3. Go to the SQL Editor (left sidebar)
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute

-- ============================================
-- TABLE: bug_reports
-- ============================================

CREATE TABLE IF NOT EXISTS public.bug_reports (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to accounts table
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- User information
  user_email text,

  -- Bug details
  title text NOT NULL,
  description text NOT NULL,

  -- Status tracking
  -- Possible values: 'new', 'reviewing', 'in-progress', 'resolved', 'closed'
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in-progress', 'resolved', 'closed')),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,

  -- Optional internal notes for admin use
  internal_notes text
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_account_id ON public.bug_reports(account_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.bug_reports IS 'Stores user-submitted bug reports for the OptiProfit application';
COMMENT ON COLUMN public.bug_reports.id IS 'Unique identifier for the bug report';
COMMENT ON COLUMN public.bug_reports.account_id IS 'References the user account that submitted the report';
COMMENT ON COLUMN public.bug_reports.user_email IS 'Email of the user who submitted the report';
COMMENT ON COLUMN public.bug_reports.title IS 'Short title/summary of the bug';
COMMENT ON COLUMN public.bug_reports.description IS 'Detailed description of the bug, including steps to reproduce';
COMMENT ON COLUMN public.bug_reports.status IS 'Current status of the bug report';
COMMENT ON COLUMN public.bug_reports.internal_notes IS 'Admin-only notes for tracking resolution progress';

-- ============================================
-- TABLE: vendor_requests
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendor_requests (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to accounts table
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- User information
  user_email text,

  -- Vendor request details
  vendor_name text NOT NULL,
  vendor_website text,
  reason text NOT NULL,

  -- Status tracking
  -- Possible values: 'new', 'reviewing', 'in-progress', 'completed', 'rejected'
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in-progress', 'completed', 'rejected')),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Optional internal notes for admin use
  internal_notes text
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_requests_account_id ON public.vendor_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_vendor_requests_status ON public.vendor_requests(status);
CREATE INDEX IF NOT EXISTS idx_vendor_requests_created_at ON public.vendor_requests(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.vendor_requests IS 'Stores user requests for new vendors to be added to the OptiProfit system';
COMMENT ON COLUMN public.vendor_requests.id IS 'Unique identifier for the vendor request';
COMMENT ON COLUMN public.vendor_requests.account_id IS 'References the user account that submitted the request';
COMMENT ON COLUMN public.vendor_requests.user_email IS 'Email of the user who submitted the request';
COMMENT ON COLUMN public.vendor_requests.vendor_name IS 'Name of the requested vendor';
COMMENT ON COLUMN public.vendor_requests.vendor_website IS 'Optional website URL for the requested vendor';
COMMENT ON COLUMN public.vendor_requests.reason IS 'User explanation for why this vendor should be added';
COMMENT ON COLUMN public.vendor_requests.status IS 'Current status of the vendor request';
COMMENT ON COLUMN public.vendor_requests.internal_notes IS 'Admin-only notes for tracking implementation progress';

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;

-- Bug Reports Policies
-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports
  FOR SELECT
  USING (auth.uid() = account_id);

-- Users can insert their own bug reports
CREATE POLICY "Users can create bug reports"
  ON public.bug_reports
  FOR INSERT
  WITH CHECK (auth.uid() = account_id);

-- Service role can do everything (for admin/backend operations)
CREATE POLICY "Service role has full access to bug reports"
  ON public.bug_reports
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Vendor Requests Policies
-- Users can view their own vendor requests
CREATE POLICY "Users can view their own vendor requests"
  ON public.vendor_requests
  FOR SELECT
  USING (auth.uid() = account_id);

-- Users can insert their own vendor requests
CREATE POLICY "Users can create vendor requests"
  ON public.vendor_requests
  FOR INSERT
  WITH CHECK (auth.uid() = account_id);

-- Service role can do everything (for admin/backend operations)
CREATE POLICY "Service role has full access to vendor requests"
  ON public.vendor_requests
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bug_reports
DROP TRIGGER IF EXISTS update_bug_reports_updated_at ON public.bug_reports;
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for vendor_requests
DROP TRIGGER IF EXISTS update_vendor_requests_updated_at ON public.vendor_requests;
CREATE TRIGGER update_vendor_requests_updated_at
  BEFORE UPDATE ON public.vendor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- After running this script, you can verify the tables were created successfully:

-- Check bug_reports table
-- SELECT * FROM public.bug_reports LIMIT 10;

-- Check vendor_requests table
-- SELECT * FROM public.vendor_requests LIMIT 10;

-- View table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name IN ('bug_reports', 'vendor_requests')
-- ORDER BY table_name, ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Feedback system tables created successfully!';
  RAISE NOTICE '📊 Tables created: bug_reports, vendor_requests';
  RAISE NOTICE '🔒 Row Level Security (RLS) policies enabled';
  RAISE NOTICE '⚡ Auto-update triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Restart your backend server to use the new tables';
  RAISE NOTICE '2. Test the bug report and vendor request forms in your app';
  RAISE NOTICE '3. View submissions in Supabase Table Editor or via API';
END $$;
