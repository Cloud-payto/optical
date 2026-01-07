/**
 * Orders Page - Main composition layer
 * Handles tab navigation, vendor filtering, and order display
 */

import React, { useState, useMemo } from 'react';
import { useOrdersByStatus } from './hooks/useOrders';
import { useOrderManagement } from './hooks/useOrderManagement';
import { OrdersTable } from './components/OrdersTable';
import { ForwardingEmailDisplay } from '../../components/ForwardingEmailDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { Filter } from 'lucide-react';

export function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'partial' | 'confirmed' | 'archived'>('pending');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'vendor'>('date');

  // Fetch data based on active tab
  const { data: orders, isLoading, error } = useOrdersByStatus(activeTab);

  // Get mutation functions
  const { confirmOrder, archiveOrder, deleteOrder } = useOrderManagement();

  // Extract unique vendors from orders
  const vendors = useMemo(() => {
    if (!orders) return [];
    const uniqueVendors = new Set(orders.map(order => order.vendor));
    return Array.from(uniqueVendors).sort();
  }, [orders]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!orders) return [];

    // Filter by vendor
    let filtered = selectedVendor === 'all'
      ? orders
      : orders.filter(order => order.vendor === selectedVendor);

    // Sort orders
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'vendor') {
        // Sort by vendor name, then by order date within vendor
        const vendorCompare = a.vendor.localeCompare(b.vendor);
        if (vendorCompare !== 0) return vendorCompare;

        // Within same vendor, sort by date (newest first)
        return new Date(b.order_date || b.confirmed_at).getTime() -
               new Date(a.order_date || a.confirmed_at).getTime();
      } else {
        // Sort by date (newest first)
        return new Date(b.order_date || b.confirmed_at).getTime() -
               new Date(a.order_date || a.confirmed_at).getTime();
      }
    });

    return sorted;
  }, [orders, selectedVendor, sortBy]);

  const leftTabs = [
    { key: 'pending' as const, label: 'Pending Orders', count: 0 },
    { key: 'partial' as const, label: 'Partial Orders', count: 0 },
    { key: 'confirmed' as const, label: 'Confirmed Orders', count: 0 },
  ];

  const rightTabs = [
    { key: 'archived' as const, label: 'Archived', count: 0 },
  ];

  // Update the count for the active tab
  const allTabs = [...leftTabs, ...rightTabs];
  const activeTabIndex = allTabs.findIndex(tab => tab.key === activeTab);
  if (activeTabIndex !== -1) {
    allTabs[activeTabIndex].count = orders?.length || 0;
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-[#181F1C] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage vendor orders and inventory</p>
        </div>
        {user?.id && <ForwardingEmailDisplay accountId={user.id} compact />}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex justify-between">
          {/* Left-aligned tabs */}
          <div className="flex space-x-8">
            {leftTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-demo={tab.key === 'pending' ? 'pending-orders-tab' : undefined}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-[#1F2623] text-gray-600 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right-aligned tabs */}
          <div className="flex space-x-8">
            {rightTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-[#1F2623] text-gray-600 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white dark:bg-[#1F2623] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter & Sort:</span>
          </div>

          {/* Vendor Filter */}
          <div className="flex-1">
            <label htmlFor="vendor-filter" className="sr-only">Filter by Vendor</label>
            <select
              id="vendor-filter"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="block w-full max-w-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-by" className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'vendor')}
              className="block rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="date">Order Date</option>
              <option value="vendor">Vendor Name</option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredAndSortedOrders.length} {filteredAndSortedOrders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">
            Error loading orders: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        orders={filteredAndSortedOrders}
        isLoading={isLoading}
        onConfirm={
          (activeTab === 'pending' || activeTab === 'partial')
            ? (orderNumber, frameIds, locationId) => confirmOrder.mutate({ orderNumber, frameIds, locationId })
            : undefined
        }
        onArchive={activeTab === 'confirmed' ? (orderId) => archiveOrder.mutate(orderId) : undefined}
        onDelete={(orderId) => deleteOrder.mutate(orderId)}
        isConfirming={confirmOrder.isPending}
      />
    </div>
  );
}

export default OrdersPage;
