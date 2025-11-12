/**
 * Notification Panel Component
 * Dropdown panel showing recent notifications
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, FileText, Package, AlertCircle, Info } from 'lucide-react';
import { Notification, NotificationType } from '../../types/notifications';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[32rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Info className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No notifications yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                  You'll see updates about orders, returns, and more here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onClick={() => onNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => {
                  onClose();
                  // Navigate to notifications page if it exists
                  window.location.href = '/notifications';
                }}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Individual Notification Item Component
function NotificationItem({
  notification,
  onMarkAsRead,
  onClick
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClick: () => void;
}) {
  const icon = getNotificationIcon(notification.type);
  const colorClasses = getNotificationColorClasses(notification.type, notification.priority);

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colorClasses.icon} p-2 rounded-lg`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium text-sm ${
              !notification.read
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-1" />
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {formatDistanceToNow(notification.created_at)}
            </span>
            {notification.priority === 'high' || notification.priority === 'urgent' ? (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                notification.priority === 'urgent'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {notification.priority}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper function to get icon for notification type
function getNotificationIcon(type: NotificationType) {
  const iconClass = "h-5 w-5";

  switch (type) {
    case 'return_report_generated':
    case 'return_report_submitted':
    case 'return_report_completed':
      return <FileText className={iconClass} />;
    case 'order_received':
    case 'inventory_updated':
      return <Package className={iconClass} />;
    case 'system_alert':
      return <AlertCircle className={iconClass} />;
    default:
      return <Info className={iconClass} />;
  }
}

// Helper function to get color classes for notification type
function getNotificationColorClasses(type: NotificationType, priority: string) {
  if (priority === 'urgent') {
    return {
      icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    };
  }

  switch (type) {
    case 'return_report_generated':
    case 'return_report_submitted':
    case 'return_report_completed':
      return {
        icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      };
    case 'order_received':
      return {
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      };
    case 'inventory_updated':
      return {
        icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      };
    case 'system_alert':
      return {
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
      };
    default:
      return {
        icon: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      };
  }
}
