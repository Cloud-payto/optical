/**
 * React Query hook for fetching orders data
 * Handles data fetching, caching, and loading states
 */

import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/services/api';
import { Order } from '../types/order.types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetchOrders();
      return response.orders || [];
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
}

/**
 * Hook to get orders filtered by status
 */
export function useOrdersByStatus(status: 'pending' | 'confirmed' | 'archived') {
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
export function useGroupedOrders(status?: 'pending' | 'confirmed' | 'archived') {
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
