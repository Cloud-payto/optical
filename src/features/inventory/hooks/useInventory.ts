/**
 * React Query hook for fetching inventory data
 * Handles data fetching, caching, and loading states
 */

import { useQuery } from '@tanstack/react-query';
import { fetchInventory } from '@/services/api';
import { InventoryItem } from '../types/inventory.types';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetchInventory();
      return response.inventory || [];
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
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
