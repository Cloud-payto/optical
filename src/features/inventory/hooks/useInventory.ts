/**
 * React Query hook for fetching inventory data
 * Handles data fetching, caching, and loading states
 * Includes real-time subscription for automatic updates
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '../types/inventory.types';
import toast from 'react-hot-toast';

export function useInventory() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetchInventory();
      return response.inventory || [];
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });

  // Set up real-time subscription for inventory
  useEffect(() => {
    console.log('[INVENTORY] Setting up real-time subscription...');

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'inventory',
        },
        (payload) => {
          console.log('[INVENTORY] Real-time event:', payload);

          // Invalidate and refetch inventory when any change occurs
          queryClient.invalidateQueries({ queryKey: ['inventory'] });

          // Show toast notification for new inventory items
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            const brand = newItem.brand || 'Unknown Brand';
            const model = newItem.model || '';
            const color = newItem.color ? ` - ${newItem.color}` : '';
            toast.success(`New frame added: ${brand} ${model}${color}`, {
              icon: '👓',
              duration: 4000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[INVENTORY] Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[INVENTORY] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

/**
 * Hook to get inventory filtered by status
 */
export function useInventoryByStatus(status: 'pending' | 'current' | 'archived' | 'sold') {
  const { data: inventory, ...rest } = useInventory();
  
  const filteredInventory = inventory?.filter(item => item.status === status) || [];
  
  return {
    data: filteredInventory,
    ...rest,
  };
}

/**
 * Hook to get inventory grouped by vendor and brand
 */
export function useGroupedInventory(status?: 'pending' | 'current' | 'archived' | 'sold') {
  const { data: inventory, ...rest } = useInventory();
  
  const grouped: Record<string, Record<string, InventoryItem[]>> = {};
  
  const filteredInventory = status 
    ? inventory?.filter(item => item.status === status) || []
    : inventory || [];
  
  filteredInventory.forEach(item => {
    const vendorName = item.vendor?.name || 'Unknown Vendor';
    const brandName = item.brand || 'Unknown Brand';
    
    if (!grouped[vendorName]) {
      grouped[vendorName] = {};
    }
    if (!grouped[vendorName][brandName]) {
      grouped[vendorName][brandName] = [];
    }
    grouped[vendorName][brandName].push(item);
  });
  
  return {
    data: grouped,
    ...rest,
  };
}
