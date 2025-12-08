# Migration 09: Manual Setup Guide

## Issue: Permission Error
If you got error `42501: must be owner of table buckets`, you need to create the storage bucket manually through the Supabase Dashboard.

---

## Step 1: Create Storage Bucket Manually (2 minutes)

### Via Supabase Dashboard:

1. **Open Supabase Dashboard** → Go to your project
2. **Click "Storage"** in the left sidebar
3. **Click "New bucket"** button (green button at top right)
4. **Fill in the form:**
   - **Name:** `return-reports`
   - **Public bucket:** Toggle **OFF** (keep it private)
   - **File size limit:** `10` (MB)
   - **Allowed MIME types:** Click "Add MIME type" → Enter `application/pdf`
5. **Click "Create bucket"**
6. ✅ You should now see `return-reports` in your buckets list

---

## Step 2: Run the SQL Migration (RLS Policies)

Now that the bucket exists, run the REST of migration 09 to set up security policies.

### Copy and run this simplified version:

```sql
-- =====================================================
-- Migration 09: Storage Policies (Simplified Version)
-- =====================================================
-- Run this AFTER creating the bucket manually
-- =====================================================

-- =====================================================
-- STORAGE POLICIES FOR return-reports BUCKET
-- =====================================================

-- Drop existing policies if they exist (in case of re-run)
DROP POLICY IF EXISTS "Users can upload their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own return reports" ON storage.objects;

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
DO $$
BEGIN
  ALTER TABLE public.return_reports
  ADD CONSTRAINT chk_pdf_path_format
  CHECK (pdf_path IS NULL OR pdf_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/\d{4}/.+\.pdf$');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists, skipping';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Verify bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'return-reports';

-- Verify policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%return reports%';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 09 completed successfully!';
  RAISE NOTICE 'Storage bucket "return-reports" is ready';
  RAISE NOTICE 'RLS policies are active';
END $$;
```

---

## Step 3: Verify Everything Works

Run these verification queries:

```sql
-- 1. Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'return-reports';
-- Should return 1 row with your bucket settings

-- 2. Check policies exist
SELECT policyname FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%return reports%';
-- Should return 4 rows (upload, view, update, delete)

-- 3. Check helper function exists
SELECT proname FROM pg_proc
WHERE proname = 'get_return_report_storage_path';
-- Should return 1 row

-- 4. Test the helper function
SELECT get_return_report_storage_path(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test-report.pdf'
);
-- Should return something like: 550e8400-e29b-41d4-a716-446655440000/2025/test-report.pdf
```

If all 4 queries return results, you're good to go! ✅

---

## Alternative: Run Original Migration with Manual Bucket

If you prefer to use the original migration file but skip the bucket creation:

1. **Create the bucket manually** (Step 1 above)
2. **Open the original migration:** `supabase/09-return-reports-storage.sql`
3. **Comment out or delete lines 22-44** (the DO $$ block that creates the bucket)
4. **Run the rest of the migration**

---

## Troubleshooting

### "Policy already exists" error
```sql
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can upload their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own return reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own return reports" ON storage.objects;

-- Then re-run the policy creation
```

### "Constraint already exists" error
This is fine - the constraint already exists. The migration handles this gracefully.

### Can't see the bucket
- Refresh the Storage page
- Check you're in the correct Supabase project
- Verify you have Storage enabled in your project

---

## Next Steps

Once Migration 09 is complete:
1. ✅ Proceed to Migration 10 (Notifications)
2. ✅ Test PDF downloads in your app
3. ✅ Upload a test PDF to verify permissions

---

## Quick Test After Setup

To test if everything works:

```sql
-- Insert a test file path into return_reports
-- (Replace with your actual account_id and report_id)
UPDATE return_reports
SET pdf_path = 'your-account-id-here/2025/test-report.pdf'
WHERE id = 'your-report-id-here';

-- Check it saved
SELECT id, report_number, pdf_path FROM return_reports WHERE pdf_path IS NOT NULL;
```

Then try downloading from your app's Returns page!

---

*This manual approach is actually the recommended way for production Supabase projects as it gives you more control over bucket settings.*
