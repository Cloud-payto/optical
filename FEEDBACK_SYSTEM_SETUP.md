# Feedback System Setup Guide

## Overview
The bug report and vendor request features have been successfully implemented in OptiProfit. This guide will help you set up the database and test the features.

---

## What Was Implemented

### Frontend Components
- **Report a Bug Button** - Orange button with bug icon in sidebar
- **Request a Vendor Button** - Purple button with store icon in sidebar
- **BugReportModal** - Form for submitting bug reports
- **VendorRequestModal** - Form for requesting new vendors

### Backend API
- **Routes**: `/api/feedback/bug-report` and `/api/feedback/vendor-request`
- **Database Operations**: Full CRUD operations for bug reports and vendor requests
- **Security**: Rate limiting, input sanitization, RLS policies

---

## Setup Instructions

### Step 1: Create Database Tables in Supabase

1. **Log in to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/bllrhafpqvzqahwxauzg

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run the Migration Script**
   - Open the file: `database_migrations/feedback_tables.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute

4. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should see two new tables:
     - `bug_reports`
     - `vendor_requests`

### Step 2: Restart Your Backend Server

```bash
cd server
npm start
```

Or if using nodemon:
```bash
npm run dev
```

### Step 3: Test the Features

1. **Start your frontend application**
   ```bash
   npm run dev
   ```

2. **Log in to your account**

3. **Test Bug Report**
   - Click "Report a Bug" button in the sidebar
   - Fill in the form
   - Submit
   - Check Supabase Table Editor for the new entry

4. **Test Vendor Request**
   - Click "Request a Vendor" button in the sidebar
   - Fill in the form
   - Submit
   - Check Supabase Table Editor for the new entry

---

## Viewing Submissions

### Option 1: Supabase Dashboard (Recommended)

**View Bug Reports:**
1. Go to https://supabase.com/dashboard/project/bllrhafpqvzqahwxauzg/editor
2. Click on the `bug_reports` table
3. View all submissions with filtering and sorting

**View Vendor Requests:**
1. Go to https://supabase.com/dashboard/project/bllrhafpqvzqahwxauzg/editor
2. Click on the `vendor_requests` table
3. View all submissions with filtering and sorting

### Option 2: API Endpoints (For Testing)

**Get All Bug Reports:**
```bash
curl http://localhost:3001/api/feedback/bug-reports
```

**Get All Vendor Requests:**
```bash
curl http://localhost:3001/api/feedback/vendor-requests
```

**Filter by Status:**
```bash
curl "http://localhost:3001/api/feedback/bug-reports?status=new"
curl "http://localhost:3001/api/feedback/vendor-requests?status=new&limit=10"
```

### Option 3: SQL Queries in Supabase

**Get Recent Bug Reports:**
```sql
SELECT * FROM bug_reports
ORDER BY created_at DESC
LIMIT 10;
```

**Get Recent Vendor Requests:**
```sql
SELECT * FROM vendor_requests
ORDER BY created_at DESC
LIMIT 10;
```

**Get Stats:**
```sql
-- Bug reports by status
SELECT status, COUNT(*) as count
FROM bug_reports
GROUP BY status;

-- Vendor requests by status
SELECT status, COUNT(*) as count
FROM vendor_requests
GROUP BY status;
```

---

## Database Schema

### bug_reports Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| account_id | uuid | Foreign key to accounts table |
| user_email | text | User's email address |
| title | text | Bug title (required) |
| description | text | Bug description (required) |
| status | text | Status: new, reviewing, in-progress, resolved, closed |
| created_at | timestamptz | When the report was created |
| updated_at | timestamptz | Last update timestamp |
| resolved_at | timestamptz | When the bug was resolved |
| internal_notes | text | Admin notes (optional) |

### vendor_requests Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| account_id | uuid | Foreign key to accounts table |
| user_email | text | User's email address |
| vendor_name | text | Requested vendor name (required) |
| vendor_website | text | Vendor website URL (optional) |
| reason | text | Why the vendor is needed (required) |
| status | text | Status: new, reviewing, in-progress, completed, rejected |
| created_at | timestamptz | When the request was created |
| updated_at | timestamptz | Last update timestamp |
| completed_at | timestamptz | When the request was completed |
| internal_notes | text | Admin notes (optional) |

---

## API Endpoints

### Submit Bug Report
```
POST /api/feedback/bug-report
Content-Type: application/json

{
  "title": "Calculator not working",
  "description": "When I try to calculate profit, nothing happens",
  "userId": "user-uuid",
  "userEmail": "user@example.com"
}
```

### Submit Vendor Request
```
POST /api/feedback/vendor-request
Content-Type: application/json

{
  "vendorName": "Acme Eyewear",
  "vendorWebsite": "https://acmeeyewear.com",
  "reason": "We order from them frequently and need automated tracking",
  "userId": "user-uuid",
  "userEmail": "user@example.com"
}
```

### Get All Bug Reports
```
GET /api/feedback/bug-reports
GET /api/feedback/bug-reports?status=new
GET /api/feedback/bug-reports?status=new&limit=10
```

### Get All Vendor Requests
```
GET /api/feedback/vendor-requests
GET /api/feedback/vendor-requests?status=new
GET /api/feedback/vendor-requests?status=new&limit=20
```

### Update Bug Report Status (Admin)
```
PATCH /api/feedback/bug-report/:id/status
Content-Type: application/json

{
  "status": "resolved"
}
```

### Update Vendor Request Status (Admin)
```
PATCH /api/feedback/vendor-request/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```

---

## Status Values

### Bug Report Statuses
- `new` - Just submitted
- `reviewing` - Being reviewed by team
- `in-progress` - Being worked on
- `resolved` - Bug has been fixed
- `closed` - Report closed (not actionable or duplicate)

### Vendor Request Statuses
- `new` - Just submitted
- `reviewing` - Being reviewed by team
- `in-progress` - Vendor integration in progress
- `completed` - Vendor has been added
- `rejected` - Request declined (with reason in internal_notes)

---

## Security Features

1. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
2. **Input Sanitization**: All inputs are sanitized to prevent SQL injection
3. **Row Level Security (RLS)**: Users can only view their own submissions
4. **Service Role Access**: Backend has full access via service role key
5. **CORS Protection**: Only allowed origins can access the API

---

## File Locations

### Backend
- Routes: `server/routes/feedback.js`
- Database Operations: `server/lib/supabase.js` (feedbackOperations)
- Route Registration: `server/index.js`

### Frontend
- Bug Report Modal: `src/components/modals/BugReportModal.tsx`
- Vendor Request Modal: `src/components/modals/VendorRequestModal.tsx`
- Sidebar Integration: `src/components/layout/Sidebar.tsx`

### Database
- Migration Script: `database_migrations/feedback_tables.sql`

---

## Next Steps

### Immediate
1. ✅ Run the SQL migration script in Supabase
2. ✅ Restart your backend server
3. ✅ Test both forms in the app
4. ✅ Verify submissions appear in Supabase

### Future Enhancements
- [ ] Build an admin dashboard page to view/manage submissions
- [ ] Add email notifications when submissions are received
- [ ] Add ability to reply to bug reports
- [ ] Add priority levels for bug reports
- [ ] Add file upload for bug report screenshots
- [ ] Add voting system for vendor requests
- [ ] Add export functionality (CSV/Excel)

---

## Troubleshooting

### Problem: "Failed to submit bug report"
**Solution:**
- Check if backend server is running
- Verify VITE_API_URL is correct in `.env`
- Check browser console for detailed error

### Problem: Database error about missing tables
**Solution:**
- Run the migration script in Supabase SQL Editor
- Verify tables exist in Table Editor

### Problem: "You must be logged in"
**Solution:**
- Ensure user is authenticated
- Check AuthContext is working
- Verify user.id is available

### Problem: CORS errors
**Solution:**
- Add your frontend URL to allowedOrigins in `server/index.js`
- Restart backend server

---

## Support

For issues or questions:
1. Check the Supabase logs for database errors
2. Check backend console logs for API errors
3. Check browser console for frontend errors
4. Review this documentation

---

**Setup Complete!** 🎉

Your feedback system is now ready to use. Users can submit bug reports and vendor requests, and you can view them in Supabase or build a custom admin dashboard.
