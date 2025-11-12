-- =====================================================
-- Migration 09: Return Reports Storage Bucket Setup
-- =====================================================
-- Description: Creates storage bucket for return report PDFs
--              and sets up Row Level Security policies
-- Run Date: 2025-01-12
-- =====================================================

-- IMPORTANT: This migration creates a storage bucket and policies
-- You may need to create the bucket manually via Supabase Dashboard
-- if you don't have sufficient permissions to insert into storage.buckets

-- NOTE: If you get a permission error on the INSERT below,
-- go to: Dashboard > Storage > Create a new bucket
-- Name: return-reports
-- Public: OFF (private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf
-- Then skip the INSERT and run the rest of the migration

-- Try to create the storage bucket programmatically
DO $$
BEGIN
  -- Attempt to insert the bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'return-reports',
    'return-reports',
    false, -- Private bucket, requires authentication
    10485760, -- 10MB file size limit
    ARRAY['application/pdf']::text[] -- Only allow PDF files
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Storage bucket created successfully';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to create bucket. Please create it manually via Dashboard > Storage';
    RAISE NOTICE 'Bucket name: return-reports';
    RAISE NOTICE 'Settings: Private, 10MB limit, PDF only';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create bucket automatically. Please create manually via Dashboard > Storage';
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- =====================================================
-- STORAGE POLICIES FOR return-reports BUCKET
-- =====================================================

-- Policy: Users can upload return reports to their own account folder
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

-- Policy: Users can update their own return reports (for versioning)
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
-- This function helps construct the correct storage path
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_return_report_storage_path(UUID, TEXT) TO authenticated;

-- =====================================================
-- UPDATE return_reports TABLE
-- =====================================================
-- Add index on pdf_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_reports_pdf_path
ON public.return_reports(pdf_path)
WHERE pdf_path IS NOT NULL;

-- Add a check constraint to ensure pdf_path format is correct
ALTER TABLE public.return_reports
ADD CONSTRAINT chk_pdf_path_format
CHECK (pdf_path IS NULL OR pdf_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/\d{4}/.+\.pdf$');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration';
COMMENT ON POLICY "Users can upload their own return reports" ON storage.objects
IS 'Allows authenticated users to upload PDF files to their account folder in the return-reports bucket';
COMMENT ON POLICY "Users can view their own return reports" ON storage.objects
IS 'Allows authenticated users to view/download their own return report PDFs';
COMMENT ON FUNCTION public.get_return_report_storage_path(UUID, TEXT)
IS 'Helper function to construct properly formatted storage paths for return reports';

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- =====================================================
-- Uncomment to verify bucket creation:
-- SELECT * FROM storage.buckets WHERE id = 'return-reports';

-- Uncomment to verify policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%return reports%';
