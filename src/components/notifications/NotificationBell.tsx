/**
 * Notification Bell Component
 * Displays bell icon with badge count for unread notifications
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen: boolean;
}

export function NotificationBell({ unreadCount, onClick, isOpen }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      {/* Bell Icon with animation */}
      <motion.div
        animate={unreadCount > 0 ? {
          rotate: [0, -15, 15, -10, 10, 0],
        } : {}}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
          repeat: unreadCount > 0 ? Infinity : 0,
          repeatDelay: 5
        }}
      >
        <Bell
          className={`h-5 w-5 transition-colors ${
            isOpen
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        />
      </motion.div>

      {/* Badge with count */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}

      {/* Pulse effect for new notifications */}
      {unreadCount > 0 && (
        <motion.div
          className="absolute -top-1 -right-1 bg-purple-600 rounded-full h-5 w-5"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </button>
  );
}
