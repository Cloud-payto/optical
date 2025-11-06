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
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
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

  const tabs = [
    { key: 'pending' as const, label: 'Pending Orders', count: orders?.length || 0 },
    { key: 'confirmed' as const, label: 'Confirmed Orders', count: 0 }, // Will be calculated when we fetch all orders
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage vendor orders and inventory</p>
        </div>
        {user?.id && <ForwardingEmailDisplay accountId={user.id} compact />}
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

      {/* Filters and Sorting */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter & Sort:</span>
          </div>

          {/* Vendor Filter */}
          <div className="flex-1">
            <label htmlFor="vendor-filter" className="sr-only">Filter by Vendor</label>
            <select
              id="vendor-filter"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="block w-full max-w-xs rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            <label htmlFor="sort-by" className="text-sm text-gray-600">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'vendor')}
              className="block rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="date">Order Date</option>
              <option value="vendor">Vendor Name</option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500">
            {filteredAndSortedOrders.length} {filteredAndSortedOrders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading orders: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        orders={filteredAndSortedOrders}
        isLoading={isLoading}
        onConfirm={activeTab === 'pending' ? (orderNumber) => confirmOrder.mutate(orderNumber) : undefined}
        onArchive={activeTab === 'confirmed' ? (orderId) => archiveOrder.mutate(orderId) : undefined}
        onDelete={(orderId) => deleteOrder.mutate(orderId)}
      />
    </div>
  );
}

export default OrdersPage;
