/**
 * Modern Inventory Page
 * Features: Filters, Return Window tracking, Return Report generation
 */

import React, { useState, useMemo } from 'react';
import { useInventoryByStatus } from './hooks/useInventory';
import { useInventoryManagement } from './hooks/useInventoryManagement';
import { InventoryFilters } from './components/InventoryFilters';
import { ModernInventoryTable } from './components/ModernInventoryTable';
import { ForwardingEmailDisplay } from '../../components/ForwardingEmailDisplay';
import { useAuth } from '../../contexts/AuthContext';
import type { InventoryFilters as FilterState, InventoryItem } from './types/inventory.types';
import { calculateReturnWindow } from './utils/returnWindow';

export function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'current' | 'archived' | 'sold'>('current');
  const [filters, setFilters] = useState<FilterState>({
    status: 'current',
    sortBy: 'newest'
  });
  const [returnReportItems, setReturnReportItems] = useState<InventoryItem[]>([]);

  // Fetch data based on active tab
  const { data: rawInventory, isLoading, error } = useInventoryByStatus(activeTab);

  // Get mutation functions
  const { archiveItem, restoreItem, deleteItem, markAsSold } = useInventoryManagement();

  // Extract unique values for filters
  const { vendors, brands, colors } = useMemo(() => {
    if (!rawInventory) return { vendors: [], brands: [], colors: [] };

    const vendorSet = new Set<string>();
    const brandSet = new Set<string>();
    const colorSet = new Set<string>();

    rawInventory.forEach(item => {
      if (item.vendor?.name) vendorSet.add(item.vendor.name);
      if (item.brand) brandSet.add(item.brand);
      if (item.color) colorSet.add(item.color);
    });

    return {
      vendors: Array.from(vendorSet).sort(),
      brands: Array.from(brandSet).sort(),
      colors: Array.from(colorSet).sort()
    };
  }, [rawInventory]);

  // Apply filters and sorting
  const filteredInventory = useMemo(() => {
    if (!rawInventory) return [];

    let filtered = [...rawInventory];

    // Apply filters
    if (filters.vendor) {
      filtered = filtered.filter(item => item.vendor?.name === filters.vendor);
    }
    if (filters.brand) {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }
    if (filters.color) {
      filtered = filtered.filter(item => item.color === filters.color);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'return_window':
        // Sort by return window (items expiring soon first)
        filtered.sort((a, b) => {
          const aWindow = calculateReturnWindow(a.order?.order_date);
          const bWindow = calculateReturnWindow(b.order?.order_date);
          if (!aWindow) return 1;
          if (!bWindow) return -1;
          return aWindow.daysRemaining - bWindow.daysRemaining;
        });
        break;
      case 'brand':
        filtered.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
        break;
      case 'stock':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
    }

    return filtered;
  }, [rawInventory, filters]);

  const handleAddToReturnReport = (item: InventoryItem) => {
    setReturnReportItems(prev => {
      // Check if already added
      if (prev.some(i => i.id === item.id)) {
        return prev; // Already in cart
      }
      return [...prev, item];
    });
  };

  const handleOpenReturnReport = () => {
    // TODO: Open Return Report Modal
    console.log('Open Return Report Modal with items:', returnReportItems);
  };

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: 0 },
    { key: 'current' as const, label: 'Current Inventory', count: rawInventory?.length || 0 },
    { key: 'sold' as const, label: 'Sold', count: 0 },
    { key: 'archived' as const, label: 'Archived', count: 0 },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 mt-1">Manage your frames inventory</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setFilters(prev => ({ ...prev, status: tab.key }));
                }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Forwarding Email */}
      {user?.id && <ForwardingEmailDisplay accountId={user.id} />}

      {/* Filters */}
      <InventoryFilters
        filters={filters}
        onFilterChange={setFilters}
        vendors={vendors}
        brands={brands}
        colors={colors}
        returnReportCount={returnReportItems.length}
        onOpenReturnReport={handleOpenReturnReport}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading inventory: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Modern Inventory Table */}
      <ModernInventoryTable
        items={filteredInventory}
        isLoading={isLoading}
        onAddToReturnReport={handleAddToReturnReport}
        onArchive={(itemId) => archiveItem.mutate(itemId)}
        onRestore={(itemId) => restoreItem.mutate(itemId)}
        onDelete={(itemId) => deleteItem.mutate(itemId)}
        onMarkAsSold={(itemId) => markAsSold.mutate(itemId)}
      />
    </div>
  );
}

export default InventoryPage;
