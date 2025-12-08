-- =====================================================
-- Migration 09: Storage Policies ONLY (Manual Bucket)
-- =====================================================
-- Description: RLS policies for return-reports bucket
-- Prerequisites: Create bucket manually via Dashboard first!
--
-- MANUAL STEPS FIRST:
-- 1. Dashboard > Storage > New bucket
-- 2. Name: return-reports
-- 3. Public: OFF
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: application/pdf
-- 6. Then run this SQL
-- =====================================================

-- =====================================================
-- STORAGE POLICIES FOR return-reports BUCKET
-- =====================================================

-- Drop existing policies if they exist (safe for re-running)
DROP POLICY IF EXISTS "Users can upload their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own return reports" ON storage.objects;

-- Policy: Users can upload return reports to their own account folder
-- Folder structure: {user_id}/{year}/{filename}
CREATE POLICY "Users can upload their own return reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'return-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own return reports
CREATE POLICY "Users can view their own return reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'return-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own return reports
CREATE POLICY "Users can update their own return reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'return-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'return-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own return reports
CREATE POLICY "Users can delete their own return reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'return-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- HELPER FUNCTION: Get return report storage path
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_return_report_storage_path(
  p_account_id UUID,
  p_filename TEXT
) RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  RETURN p_account_id::TEXT || '/' || v_year || '/' || p_filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_return_report_storage_path(UUID, TEXT) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION public.get_return_report_storage_path(UUID, TEXT)
IS 'Helper function to construct storage paths: account_id/year/filename.pdf';

-- =====================================================
-- UPDATE return_reports TABLE
-- =====================================================

-- Add index on pdf_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_reports_pdf_path
ON public.return_reports(pdf_path)
WHERE pdf_path IS NOT NULL;

-- Add constraint to validate pdf_path format
DO $$
BEGIN
  ALTER TABLE public.return_reports
  ADD CONSTRAINT chk_pdf_path_format
  CHECK (pdf_path IS NULL OR pdf_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/\d{4}/.+\.pdf$');

  RAISE NOTICE '✅ Constraint added successfully';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️  Constraint already exists, skipping';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify bucket exists
DO $$
DECLARE
  v_bucket_count INT;
BEGIN
  SELECT COUNT(*) INTO v_bucket_count
  FROM storage.buckets
  WHERE id = 'return-reports';

  IF v_bucket_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Bucket "return-reports" does not exist! Create it manually first via Dashboard > Storage';
  ELSE
    RAISE NOTICE '✅ Bucket "return-reports" exists';
  END IF;
END $$;

-- Verify policies
DO $$
DECLARE
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%return reports%';

  IF v_policy_count = 4 THEN
    RAISE NOTICE '✅ All 4 storage policies created successfully';
  ELSE
    RAISE WARNING '⚠️  Expected 4 policies, found %', v_policy_count;
  END IF;
END $$;

-- Verify function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_return_report_storage_path'
  ) THEN
    RAISE NOTICE '✅ Helper function created successfully';
  ELSE
    RAISE WARNING '⚠️  Helper function not found';
  END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration 09 completed successfully!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Storage bucket "return-reports" is configured';
  RAISE NOTICE 'RLS policies are active';
  RAISE NOTICE 'Helper functions are available';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run Migration 10 (Notifications)';
  RAISE NOTICE '';
END $$;
