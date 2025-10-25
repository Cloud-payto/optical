/**
 * Inventory Page - Main composition layer
 * Handles tab navigation and inventory display
 */

import React, { useState } from 'react';
import { useInventoryByStatus } from './hooks/useInventory';
import { useInventoryManagement } from './hooks/useInventoryManagement';
import { InventoryTable } from './components/InventoryTable';

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'current' | 'archived' | 'sold'>('current');

  // Fetch data based on active tab
  const { data: inventory, isLoading, error } = useInventoryByStatus(activeTab);

  // Get mutation functions
  const { archiveItem, restoreItem, deleteItem, markAsSold } = useInventoryManagement();

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: 0 },
    { key: 'current' as const, label: 'Current Inventory', count: inventory?.length || 0 },
    { key: 'sold' as const, label: 'Sold', count: 0 },
    { key: 'archived' as const, label: 'Archived', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 mt-1">Manage your frames inventory</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading inventory: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Inventory Table */}
      <InventoryTable
        items={inventory || []}
        isLoading={isLoading}
        onArchive={activeTab === 'current' ? (itemId) => archiveItem.mutate(itemId) : undefined}
        onRestore={activeTab === 'archived' ? (itemId) => restoreItem.mutate(itemId) : undefined}
        onDelete={(itemId) => deleteItem.mutate(itemId)}
        onMarkAsSold={activeTab === 'current' ? (itemId) => markAsSold.mutate(itemId) : undefined}
      />
    </div>
  );
}

export default InventoryPage;
