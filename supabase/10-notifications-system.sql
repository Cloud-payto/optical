-- =====================================================
-- Migration 10: Notifications System
-- =====================================================
-- Description: Creates notifications table and related infrastructure
--              for in-app notification system
-- Run Date: 2025-01-12
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'return_report_generated',
    'return_report_submitted',
    'return_report_completed',
    'order_received',
    'inventory_updated',
    'system_alert',
    'info'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT notifications_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT notifications_message_not_empty CHECK (length(trim(message)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_notifications_account_id ON public.notifications(account_id);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_priority ON public.notifications(priority);

-- Composite index for common queries (unread notifications for an account)
CREATE INDEX idx_notifications_account_unread ON public.notifications(account_id, read, created_at DESC)
WHERE read = false;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM public.accounts WHERE user_id = auth.uid()
  )
);

-- Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  account_id IN (
    SELECT id FROM public.accounts WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  account_id IN (
    SELECT id FROM public.accounts WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
  account_id IN (
    SELECT id FROM public.accounts WHERE user_id = auth.uid()
  )
);

-- Policy: System can insert notifications (for triggers and functions)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be restricted by application logic

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_account_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    account_id,
    type,
    title,
    message,
    priority,
    action_url,
    metadata
  ) VALUES (
    p_account_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_action_url,
    p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET
    read = true,
    read_at = NOW()
  WHERE id = p_notification_id
    AND read = false;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;

-- Function: Mark all notifications as read for an account
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET
    read = true,
    read_at = NOW()
  WHERE account_id = p_account_id
    AND read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(UUID) TO authenticated;

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.notifications
  WHERE account_id = p_account_id
    AND read = false;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;

-- Function: Delete old read notifications (for cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read = true
    AND read_at < NOW() - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- =====================================================

-- Trigger: Notify when return report status changes
CREATE OR REPLACE FUNCTION public.notify_return_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Return report submitted
    IF NEW.status = 'sent' THEN
      PERFORM public.create_notification(
        NEW.account_id,
        'return_report_submitted',
        'Return Report Submitted',
        'Return report ' || NEW.report_number || ' has been sent to ' || NEW.sent_to_email,
        'medium',
        '/returns',
        jsonb_build_object(
          'report_id', NEW.id,
          'report_number', NEW.report_number,
          'vendor_name', (SELECT name FROM vendors WHERE id = NEW.vendor_id)
        )
      );
    END IF;

    -- Return report generated
    IF NEW.status = 'generated' AND OLD.status = 'draft' THEN
      PERFORM public.create_notification(
        NEW.account_id,
        'return_report_generated',
        'Return Report Generated',
        'Return report ' || NEW.report_number || ' is ready for download',
        'low',
        '/returns',
        jsonb_build_object(
          'report_id', NEW.id,
          'report_number', NEW.report_number
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to return_reports table
DROP TRIGGER IF EXISTS trigger_notify_return_report_status ON public.return_reports;
CREATE TRIGGER trigger_notify_return_report_status
AFTER INSERT OR UPDATE ON public.return_reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_return_report_status_change();

-- Trigger: Notify when new order is received
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.account_id,
      'order_received',
      'New Order Received',
      'Order ' || NEW.order_number || ' from ' || COALESCE(NEW.customer_name, 'Unknown') || ' has been received',
      'medium',
      '/inventory?tab=orders',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'total_pieces', NEW.total_pieces
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
CREATE TRIGGER trigger_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.notifications IS 'Stores in-app notifications for users';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification for categorization and filtering';
COMMENT ON COLUMN public.notifications.priority IS 'Priority level affects display order and styling';
COMMENT ON COLUMN public.notifications.action_url IS 'Optional URL to navigate when notification is clicked';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional structured data related to the notification';

COMMENT ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
IS 'Creates a new notification for an account';

COMMENT ON FUNCTION public.mark_notification_read(UUID)
IS 'Marks a single notification as read';

COMMENT ON FUNCTION public.mark_all_notifications_read(UUID)
IS 'Marks all unread notifications as read for an account';

COMMENT ON FUNCTION public.get_unread_notification_count(UUID)
IS 'Returns the count of unread notifications for an account';

COMMENT ON FUNCTION public.cleanup_old_notifications(INTEGER)
IS 'Deletes old read notifications (default 30 days). Run periodically for maintenance.';

-- =====================================================
-- SEED DATA: Welcome notification for existing users
-- =====================================================

-- Create a welcome notification for all existing accounts
INSERT INTO public.notifications (account_id, type, title, message, priority, read)
SELECT
  id as account_id,
  'info' as type,
  'Welcome to Notifications!' as title,
  'Stay updated with real-time notifications about your return reports, orders, and inventory changes.' as message,
  'low' as priority,
  false as read
FROM public.accounts
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications WHERE account_id = accounts.id
);

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- =====================================================

-- Verify table creation
-- SELECT * FROM public.notifications LIMIT 5;

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'notifications';

-- Verify RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Test notification count function
-- SELECT public.get_unread_notification_count('<your-account-id>');
