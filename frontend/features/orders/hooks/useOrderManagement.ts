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
    mutationFn: ({ orderNumber, frameIds }: { orderNumber: string; frameIds?: string[] }) =>
      confirmPendingOrder(orderNumber, frameIds),
    onSuccess: (data) => {
      // Invalidate both orders and inventory since confirming affects both
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      // Show appropriate success message based on order status
      if (data.orderStatus === 'partial') {
        toast.success(
          `Order partially confirmed! ${data.receivedItems} of ${data.totalItems} frames received.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Order confirmed! ${data.updatedCount} items moved to current inventory.`,
          { duration: 4000 }
        );
      }
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
