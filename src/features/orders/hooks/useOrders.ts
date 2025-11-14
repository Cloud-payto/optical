/**
 * React Query hook for fetching orders data
 * Handles data fetching, caching, and loading states
 * Includes real-time subscription for automatic updates
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, fetchOrderById } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Order } from '../types/order.types';
import toast from 'react-hot-toast';

export function useOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetchOrders();
      return response.orders || [];
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });

  // Set up real-time subscription for orders
  useEffect(() => {
    console.log('[ORDERS] Setting up real-time subscription...');

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('[ORDERS] Real-time event:', payload);

          // Invalidate and refetch orders when any change occurs
          queryClient.invalidateQueries({ queryKey: ['orders'] });

          // Show toast notification for new orders
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            const orderId = newOrder.id;
            const accountId = newOrder.account_id;

            // Fetch the complete order with vendor info instead of using raw payload
            // This ensures we get the vendor name from the vendors table join
            fetchOrderById(orderId, accountId)
              .then(response => {
                const order = response.order;
                // Backend flattens vendor object to string, so we can use it directly
                const vendorName = order.vendor || 'Unknown Vendor';
                const orderNumber = order.order_number || 'N/A';

                toast.success(`New order received: ${vendorName} #${orderNumber}`, {
                  icon: '📦',
                  duration: 4000,
                });
              })
              .catch(error => {
                console.error('Error fetching order for notification:', error);
                // Fallback to basic notification without vendor name
                const orderNumber = newOrder.order_number || 'N/A';
                toast.success(`New order received: #${orderNumber}`, {
                  icon: '📦',
                  duration: 4000,
                });
              });
          }
        }
      )
      .subscribe((status) => {
        console.log('[ORDERS] Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[ORDERS] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

/**
 * Hook to get orders filtered by status
 */
export function useOrdersByStatus(status: 'pending' | 'partial' | 'confirmed' | 'archived') {
  const { data: orders, ...rest } = useOrders();

  const filteredOrders = orders?.filter(order => order.status === status) || [];

  return {
    data: filteredOrders,
    ...rest,
  };
}

/**
 * Hook to get orders grouped by vendor and order number
 */
export function useGroupedOrders(status?: 'pending' | 'partial' | 'confirmed' | 'archived') {
  const { data: orders, ...rest } = useOrders();

  const grouped: Record<string, Record<string, Order>> = {};

  const filteredOrders = status
    ? orders?.filter(order => order.status === status) || []
    : orders || [];

  filteredOrders.forEach(order => {
    if (!grouped[order.vendor]) {
      grouped[order.vendor] = {};
    }
    grouped[order.vendor][order.order_number] = order;
  });

  return {
    data: grouped,
    ...rest,
  };
}
