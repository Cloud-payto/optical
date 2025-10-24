/**
 * React Query mutations for order management
 * Handles confirming, archiving, and deleting orders
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmPendingOrder, archiveOrder, deleteOrder } from '@/services/api';
import toast from 'react-hot-toast';

export function useOrderManagement() {
  const queryClient = useQueryClient();

  const confirmOrder = useMutation({
    mutationFn: (orderNumber: string) => confirmPendingOrder(orderNumber),
    onSuccess: (data) => {
      // Invalidate both orders and inventory since confirming affects both
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Order confirmed! ${data.updatedCount} items moved to current inventory.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm order');
    },
  });

  const archiveOrderMutation = useMutation({
    mutationFn: (orderId: number) => archiveOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order archived successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive order');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: number) => deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete order');
    },
  });

  return {
    confirmOrder,
    archiveOrder: archiveOrderMutation,
    deleteOrder: deleteOrderMutation,
  };
}
