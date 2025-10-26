/**
 * React Query mutations for inventory management
 * Handles archiving, restoring, deleting, and marking as sold
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  archiveInventoryItem, 
  restoreInventoryItem, 
  deleteInventoryItem,
  markItemAsSold,
  archiveAllItemsByBrand,
  deleteArchivedItemsByBrand,
  deleteArchivedItemsByVendor
} from '@/services/api';
import toast from 'react-hot-toast';

export function useInventoryManagement() {
  const queryClient = useQueryClient();

  const archiveItem = useMutation({
    mutationFn: (itemId: string) => archiveInventoryItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item archived successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive item');
    },
  });

  const restoreItem = useMutation({
    mutationFn: (itemId: string) => restoreInventoryItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item restored to current inventory');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to restore item');
    },
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => deleteInventoryItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item');
    },
  });

  const markAsSold = useMutation({
    mutationFn: (itemId: string) => markItemAsSold(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item marked as sold');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark item as sold');
    },
  });

  const archiveBrand = useMutation({
    mutationFn: ({ brandName, vendorName }: { brandName: string; vendorName: string }) => 
      archiveAllItemsByBrand(brandName, vendorName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Archived ${data.archivedCount} items`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive brand items');
    },
  });

  const deleteArchivedBrand = useMutation({
    mutationFn: ({ brandName, vendorName }: { brandName: string; vendorName: string }) => 
      deleteArchivedItemsByBrand(brandName, vendorName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Deleted ${data.deletedCount} archived items`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete archived items');
    },
  });

  const deleteArchivedVendor = useMutation({
    mutationFn: (vendorName: string) => deleteArchivedItemsByVendor(vendorName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Deleted ${data.deletedCount} archived items`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete archived vendor items');
    },
  });

  return {
    archiveItem,
    restoreItem,
    deleteItem,
    markAsSold,
    archiveBrand,
    deleteArchivedBrand,
    deleteArchivedVendor,
  };
}
