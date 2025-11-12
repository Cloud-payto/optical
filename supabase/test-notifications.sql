-- =====================================================
-- TEST QUERIES FOR NOTIFICATION SYSTEM
-- =====================================================
-- Use these queries to test the notification system
-- Replace <your-account-id> with actual UUID from accounts table
-- =====================================================

-- =====================================================
-- STEP 1: GET YOUR ACCOUNT ID
-- =====================================================
-- Run this first to find your account ID
SELECT id, name, email FROM public.accounts WHERE email = 'your-email@example.com';
-- Copy the 'id' value for use below

-- =====================================================
-- STEP 2: CREATE TEST NOTIFICATIONS
-- =====================================================

-- Test 1: Create a simple info notification
SELECT create_notification(
  '<your-account-id>'::uuid,
  'info',
  'Welcome to Notifications! 🎉',
  'Your notification system is working perfectly. Click to view return reports.',
  'low',
  '/returns',
  '{"test": true}'::jsonb
);

-- Test 2: Create a return report notification
SELECT create_notification(
  '<your-account-id>'::uuid,
  'return_report_generated',
  'Return Report Ready',
  'Return report RR-2025-TEST has been generated and is ready for download.',
  'medium',
  '/returns',
  jsonb_build_object(
    'report_number', 'RR-2025-TEST',
    'vendor_name', 'Test Vendor'
  )
);

-- Test 3: Create a high priority order notification
SELECT create_notification(
  '<your-account-id>'::uuid,
  'order_received',
  'New Order Received!',
  'Order #TEST-12345 from Downtown Vision Center has been received with 15 items.',
  'high',
  '/inventory?tab=orders',
  jsonb_build_object(
    'order_number', 'TEST-12345',
    'total_pieces', 15
  )
);

-- Test 4: Create an urgent system alert
SELECT create_notification(
  '<your-account-id>'::uuid,
  'system_alert',
  'Urgent: System Maintenance',
  'Scheduled maintenance will occur tonight at 2 AM EST. Please save your work.',
  'urgent',
  NULL,
  jsonb_build_object(
    'maintenance_time', '2025-01-13 02:00:00'
  )
);

-- Test 5: Create inventory update notification
SELECT create_notification(
  '<your-account-id>'::uuid,
  'inventory_updated',
  'Inventory Updated',
  'Your inventory has been updated with 8 new items from Safilo Group.',
  'medium',
  '/inventory',
  jsonb_build_object(
    'items_count', 8,
    'vendor', 'Safilo Group'
  )
);

-- =====================================================
-- STEP 3: VIEW YOUR NOTIFICATIONS
-- =====================================================

-- View all notifications for your account
SELECT
  id,
  type,
  title,
  message,
  priority,
  read,
  created_at,
  action_url
FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
ORDER BY created_at DESC;

-- View only unread notifications
SELECT
  id,
  type,
  title,
  message,
  priority,
  created_at
FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
  AND read = false
ORDER BY created_at DESC;

-- Get unread count
SELECT get_unread_notification_count('<your-account-id>'::uuid);

-- =====================================================
-- STEP 4: MARK NOTIFICATIONS AS READ
-- =====================================================

-- Mark a specific notification as read (replace with actual notification ID)
SELECT mark_notification_read('<notification-id>'::uuid);

-- Mark all notifications as read
SELECT mark_all_notifications_read('<your-account-id>'::uuid);

-- =====================================================
-- STEP 5: TEST AUTOMATIC TRIGGERS
-- =====================================================

-- Test return report trigger by updating status
-- First, find a return report
SELECT id, report_number, status FROM public.return_reports
WHERE account_id = '<your-account-id>'::uuid
LIMIT 1;

-- Update its status to trigger notification
UPDATE public.return_reports
SET status = 'sent',
    sent_to_email = 'vendor@example.com',
    sent_at = NOW()
WHERE id = '<return-report-id>'::uuid
  AND account_id = '<your-account-id>'::uuid;

-- Check if notification was created
SELECT * FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
  AND type = 'return_report_submitted'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- STEP 6: CLEANUP TEST DATA
-- =====================================================

-- Delete all test notifications
DELETE FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
  AND (
    metadata->>'test' = 'true'
    OR message LIKE '%test%'
    OR message LIKE '%Test%'
  );

-- Delete old read notifications (older than 30 days)
SELECT cleanup_old_notifications(30);

-- =====================================================
-- STEP 7: NOTIFICATION STATISTICS
-- =====================================================

-- Count notifications by type
SELECT
  type,
  COUNT(*) as total,
  SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread
FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
GROUP BY type
ORDER BY total DESC;

-- Count notifications by priority
SELECT
  priority,
  COUNT(*) as total,
  SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread
FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
GROUP BY priority
ORDER BY
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- Recent notification activity
SELECT
  DATE(created_at) as date,
  COUNT(*) as notifications_created,
  SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as notifications_read
FROM public.notifications
WHERE account_id = '<your-account-id>'::uuid
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- DEBUGGING QUERIES
-- =====================================================

-- Check if RLS policies are working
SET ROLE authenticated;
SELECT COUNT(*) as visible_notifications
FROM public.notifications;
RESET ROLE;

-- Verify triggers exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%notify%';

-- Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'notifications';

-- View notification functions
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE '%notification%';
