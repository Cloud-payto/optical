# Quick Start Guide: Return Reports & Notifications

## 🚀 Get Started in 5 Minutes

### Prerequisites
- ✅ Supabase project set up
- ✅ Environment variables configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- ✅ Development server running (`npm run dev`)

---

## Step 1: Run SQL Migrations (2 minutes)

### Migration 09: PDF Storage Setup

1. Open Supabase Dashboard → **SQL Editor**
2. Open file: `supabase/09-return-reports-storage.sql`
3. Copy **all contents** and paste into SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. ✅ Verify: Go to **Storage** → Should see `return-reports` bucket

### Migration 10: Notifications System

1. Still in **SQL Editor**
2. Open file: `supabase/10-notifications-system.sql`
3. Copy **all contents** and paste into SQL Editor
4. Click **Run**
5. ✅ Verify: Run this query:
```sql
SELECT * FROM notifications LIMIT 5;
```
You should see a welcome notification!

---

## Step 2: Test PDF Downloads (1 minute)

1. Navigate to `/returns` in your app
2. Click the **Download** button on any report
3. ✅ Should see:
   - Spinner animation
   - "Downloading..." text
   - PDF downloads to your browser
   - Success toast appears

**Note:** Mock data has placeholder paths. To test fully:
- Generate a return report from Inventory page
- It will auto-upload to storage
- Download will work with real file

---

## Step 3: Test Notifications (2 minutes)

### Visual Test
1. Look at the header - you should see a **bell icon** 🔔
2. Should have a **purple badge** with number (at least 1 from welcome message)
3. Click the bell
4. ✅ Should see:
   - Dropdown panel slides down
   - Shows "Welcome to Notifications!" message
   - Click notification to test navigation

### Create Test Notifications

1. Go to **Supabase SQL Editor**
2. Find your account ID:
```sql
SELECT id, email FROM accounts WHERE email = 'your-email@example.com';
```
3. Copy the `id` value
4. Create a test notification:
```sql
SELECT create_notification(
  'YOUR-ACCOUNT-ID-HERE'::uuid,
  'info',
  'Test Notification! 🎉',
  'This is a test. Click to view returns.',
  'medium',
  '/returns',
  '{}'::jsonb
);
```
5. ✅ **Watch your app** - notification should appear instantly!
   - Bell badge updates
   - New notification in panel
   - Toast appears saying "Test Notification!"

---

## Step 4: Test Real-Time Updates

Open two browser tabs with your app:

**Tab 1:**
- Open notification panel
- Leave it open

**Tab 2:**
- Run this in Supabase SQL Editor:
```sql
SELECT create_notification(
  'YOUR-ACCOUNT-ID'::uuid,
  'order_received',
  'New Order Alert!',
  'Order #12345 received with 10 items',
  'high',
  '/inventory?tab=orders',
  '{}'::jsonb
);
```

**Tab 1 (watch):**
- ✅ Notification appears instantly without refresh!
- ✅ Badge count increases
- ✅ Toast notification pops up

---

## Step 5: Test Automatic Triggers

Notifications are automatically created when:

### 1. Return Report Status Changes
```sql
-- Find a return report
SELECT id, report_number, status FROM return_reports LIMIT 1;

-- Update its status
UPDATE return_reports
SET status = 'sent',
    sent_to_email = 'vendor@example.com',
    sent_at = NOW()
WHERE id = 'YOUR-REPORT-ID'::uuid;
```
✅ **Automatic notification created!** Check your bell icon.

### 2. New Order Created
```sql
-- Insert a test order (replace with your IDs)
INSERT INTO orders (
  account_id,
  order_number,
  customer_name,
  total_pieces,
  status
) VALUES (
  'YOUR-ACCOUNT-ID'::uuid,
  'TEST-ORDER-001',
  'Test Customer',
  5,
  'pending'
);
```
✅ **Automatic notification created!**

---

## Step 6: Test All Features

### Notification Panel Features:
- ✅ Click bell to open/close
- ✅ Click outside to close
- ✅ Click "Mark all read" button
- ✅ Click individual notification
- ✅ Navigate to action URL
- ✅ See unread indicator (purple dot)
- ✅ Priority badges (high/urgent)
- ✅ Timestamp ("5 minutes ago")

### Bell Icon Features:
- ✅ Badge shows correct count
- ✅ Badge disappears when all read
- ✅ Wiggle animation (wait 5 seconds when unread)
- ✅ Pulse effect on badge
- ✅ Color changes when open (purple)

### Mobile Test:
- ✅ Open on mobile device or narrow browser
- ✅ Bell appears next to hamburger menu
- ✅ Panel works on mobile
- ✅ Touch-friendly

### Dark Mode Test:
*(If dark mode is implemented in your theme)*
- ✅ Bell icon visible in dark mode
- ✅ Panel background dark
- ✅ Text readable
- ✅ Hover states work

---

## 🐛 Troubleshooting

### "Bell icon not showing"
```bash
# Clear build cache and restart
rm -rf node_modules/.vite
npm run dev
```

### "Notifications not loading"
1. Check browser console for errors
2. Verify Supabase Realtime is enabled:
   - Dashboard → Settings → API
   - Realtime should be "Enabled"
3. Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### "PDF download not working"
1. Check storage bucket exists:
   - Dashboard → Storage
   - Should see `return-reports` bucket
2. Verify RLS policies on storage:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### "Badge count wrong"
```sql
-- Recalculate manually
SELECT COUNT(*) FROM notifications
WHERE account_id = 'YOUR-ACCOUNT-ID'::uuid
  AND read = false;
```

---

## 📝 Quick Reference

### Notification Types
- `info` - General information (gray icon)
- `return_report_generated` - Report ready (purple icon)
- `return_report_submitted` - Report sent (purple icon)
- `return_report_completed` - Report completed (purple icon)
- `order_received` - New order (blue icon)
- `inventory_updated` - Inventory change (green icon)
- `system_alert` - System message (orange icon)

### Priority Levels
- `low` - No badge
- `medium` - No badge (default)
- `high` - Orange badge
- `urgent` - Red badge, red icon background

### Useful SQL Queries

**Delete all notifications:**
```sql
DELETE FROM notifications WHERE account_id = 'YOUR-ID'::uuid;
```

**Mark all as read:**
```sql
SELECT mark_all_notifications_read('YOUR-ID'::uuid);
```

**View notification stats:**
```sql
SELECT type, COUNT(*) as count, SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread
FROM notifications WHERE account_id = 'YOUR-ID'::uuid GROUP BY type;
```

---

## ✅ Success Checklist

Before moving to production:

- [ ] Both SQL migrations ran successfully
- [ ] Bell icon visible in header
- [ ] Badge shows unread count
- [ ] Panel opens/closes smoothly
- [ ] Can mark notifications as read
- [ ] Real-time updates working
- [ ] PDF download working
- [ ] Automatic triggers working
- [ ] Mobile layout works
- [ ] Dark mode looks good (if applicable)
- [ ] No console errors
- [ ] Toast notifications appear

---

## 🎉 You're Done!

Your notification system and PDF downloads are fully functional!

**Next Steps:**
1. Customize notification messages in SQL triggers
2. Add more notification types as needed
3. Implement user preferences UI
4. Set up email notifications (optional)

**Need Help?**
- Check `IMPLEMENTATION_SUMMARY.md` for details
- Use `supabase/test-notifications.sql` for testing
- Check browser console for errors
- Verify Supabase dashboard for data

---

*Happy building! 🚀*
