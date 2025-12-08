/**
 * useNotifications Hook
 * Manages notification state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types/notifications';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(limit: number = 20): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch account_id from accounts table
  const getAccountId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[NOTIFICATIONS] Error fetching account:', error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.error('[NOTIFICATIONS] Exception fetching account:', err);
      return null;
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accountId = await getAccountId();
      if (!accountId) {
        setError('Account not found');
        setLoading(false);
        return;
      }

      // Fetch notifications
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      const notifs = (data || []) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('[NOTIFICATIONS] Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, limit, getAccountId]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NOTIFICATIONS] Error marking as read:', err);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const accountId = await getAccountId();
      if (!accountId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('[NOTIFICATIONS] Error marking all as read:', err);
      toast.error('Failed to mark all as read');
    }
  }, [user, getAccountId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      const accountId = await getAccountId();
      if (!accountId) return;

      console.log('[NOTIFICATIONS] Setting up real-time subscription');

      subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `account_id=eq.${accountId}`
          },
          (payload) => {
            console.log('[NOTIFICATIONS] Real-time update:', payload);

            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev].slice(0, limit));
              if (!newNotification.read) {
                setUnreadCount(prev => prev + 1);
                // Show toast for new notification
                toast.success(newNotification.title, {
                  icon: '🔔',
                  duration: 4000
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedNotification = payload.new as Notification;
              setNotifications(prev =>
                prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
              );
              // Recalculate unread count
              fetchNotifications();
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev =>
                prev.filter(n => n.id !== payload.old.id)
              );
              fetchNotifications();
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        console.log('[NOTIFICATIONS] Cleaning up subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, [user, limit, getAccountId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
