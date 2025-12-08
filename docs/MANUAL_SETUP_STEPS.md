# Manual Setup Steps for Return Report Fix

## Required Steps Before Testing

### Step 1: Run Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/10-return-reports-columns.sql`
5. Click **Run** to execute the migration
6. Verify success message appears

**Expected Output:**
```
Success. No rows returned.
```

### Step 2: Verify Storage Bucket Exists

1. In Supabase Dashboard, go to **Storage**
2. Look for bucket named `return-reports`

**If bucket exists:**
- Verify it's set to **Private** (not public)
- Verify file size limit is **10MB**
- Verify allowed MIME types includes `application/pdf`

**If bucket does NOT exist:**
1. Click **New bucket**
2. Set name: `return-reports`
3. Set **Public**: OFF (private)
4. Set **File size limit**: 10485760 (10MB)
5. Set **Allowed MIME types**: `application/pdf`
6. Click **Create bucket**

### Step 3: Verify RLS Policies

1. In Supabase Dashboard, go to **Storage** → **Policies**
2. Select `return-reports` bucket
3. Verify these 4 policies exist:
   - ✅ "Users can upload their own return reports" (INSERT)
   - ✅ "Users can view their own return reports" (SELECT)
   - ✅ "Users can update their own return reports" (UPDATE)
   - ✅ "Users can delete their own return reports" (DELETE)

**If policies are missing:**
1. Go to **SQL Editor**
2. Run the SQL from `supabase/09-return-reports-storage.sql`
3. Verify policies appear in the dashboard

### Step 4: Restart Backend Server

**If running locally:**
```bash
cd server
npm start
# or
node index.js
```

**If deployed on Render/Vercel:**
- Commit and push changes to trigger automatic deployment
- Or manually trigger redeploy from dashboard

**Verify server started successfully:**
Check console for:
```
✅ Supabase connection established
🚀 Server running on port 3001
```

### Step 5: Restart Frontend Dev Server

**If running locally:**
```bash
npm run dev
# or
yarn dev
```

**Verify frontend started:**
Open browser to http://localhost:5173

---

## Quick Verification Commands

### Check if backend route is registered:
```bash
curl http://localhost:3001/api/return-reports
# Should return 401 (unauthorized) if not logged in
# Should NOT return 404 (not found)
```

### Check database columns exist:
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'return_reports'
  AND column_name IN ('vendor_name', 'filename', 'item_count', 'total_quantity', 'generated_date');
```

**Expected output:** 5 rows showing all columns exist

### Check storage bucket exists:
```sql
-- Run in Supabase SQL Editor
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'return-reports';
```

**Expected output:** 1 row with name='return-reports', public=false

---

## Troubleshooting

### Problem: "Cannot find module './routes/returnReports'"
**Solution:** Verify file was created at `server/routes/returnReports.js`

### Problem: "Column 'vendor_name' does not exist"
**Solution:** Run database migration from Step 1

### Problem: "Bucket 'return-reports' not found"
**Solution:** Create storage bucket from Step 2

### Problem: Storage upload returns 403 Forbidden
**Solution:**
1. Verify RLS policies exist (Step 3)
2. Verify user is authenticated
3. Check user ID matches folder structure in path

### Problem: Downloads return 404 Not Found
**Possible causes:**
1. File was never uploaded (check storage bucket)
2. Wrong path format (should be `{user_id}/2025/{filename}.pdf`)
3. RLS policy blocking access
4. User trying to access another user's file

### Problem: TypeScript errors in frontend
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

---

## Testing the Fix (Quick Test)

1. **Login** to the application
2. Navigate to **Inventory** page
3. Click **"Add to Return"** on 2-3 items from same vendor
4. Click **"Return Report"** button in top bar
5. In modal, click **"Generate Report"** for the vendor
6. **Verify:**
   - Loading toast appears
   - PDF downloads to browser
   - Success message shows
   - Modal closes
7. Navigate to **Returns** page from sidebar
8. **Verify:**
   - Report appears in table
   - Shows correct vendor, items, date
9. Click **"Download"** button
10. **Verify:**
    - PDF downloads again
    - File opens correctly

**If all steps pass:** ✅ Fix is working!

---

## Files to Commit

After testing successfully, commit these files:

```bash
git add supabase/10-return-reports-columns.sql
git add server/routes/returnReports.js
git add server/index.js
git add src/services/api.ts
git add src/features/inventory/InventoryPage.tsx
git add src/features/reports/ReturnsPage.tsx
git add RETURN_REPORT_FIX_SUMMARY.md
git add MANUAL_SETUP_STEPS.md

git commit -m "fix: Implement return report PDF upload and storage

- Add missing database columns to return_reports table
- Create backend API endpoint for return reports CRUD
- Add frontend API functions for report management
- Fix handleGenerateReport to upload PDFs to Supabase Storage
- Replace mock data in ReturnsPage with real API calls
- Add comprehensive error handling and loading states

Fixes #[issue-number] - Return report download 404 error"

git push
```

---

**Setup Time Estimate:** 5-10 minutes
**Testing Time Estimate:** 10-15 minutes
