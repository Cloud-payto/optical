/**
 * Notification System Types
 * Types and interfaces for the notification system
 */

export type NotificationType =
  | 'return_report_generated'
  | 'return_report_submitted'
  | 'return_report_completed'
  | 'order_received'
  | 'inventory_updated'
  | 'system_alert'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  account_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types: {
    return_reports: boolean;
    orders: boolean;
    inventory: boolean;
    system_alerts: boolean;
  };
}

export interface CreateNotificationInput {
  account_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}
