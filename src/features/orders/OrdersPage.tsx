/**
 * Orders Page - Main composition layer
 * Handles tab navigation and order display
 */

import React, { useState } from 'react';
import { useOrdersByStatus } from './hooks/useOrders';
import { useOrderManagement } from './hooks/useOrderManagement';
import { OrdersTable } from './components/OrdersTable';
import { ForwardingEmailDisplay } from '../../components/ForwardingEmailDisplay';
import { useAuth } from '../../contexts/AuthContext';

export function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');

  // Fetch data based on active tab
  const { data: orders, isLoading, error } = useOrdersByStatus(activeTab);

  // Get mutation functions
  const { confirmOrder, archiveOrder, deleteOrder } = useOrderManagement();

  const tabs = [
    { key: 'pending' as const, label: 'Pending Orders', count: orders?.length || 0 },
    { key: 'confirmed' as const, label: 'Confirmed Orders', count: 0 }, // Will be calculated when we fetch all orders
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage vendor orders and inventory</p>
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

      {/* Forwarding Email */}
      {user?.id && <ForwardingEmailDisplay accountId={user.id} />}

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
        orders={orders || []}
        isLoading={isLoading}
        onConfirm={activeTab === 'pending' ? (orderNumber) => confirmOrder.mutate(orderNumber) : undefined}
        onArchive={activeTab === 'confirmed' ? (orderId) => archiveOrder.mutate(orderId) : undefined}
        onDelete={(orderId) => deleteOrder.mutate(orderId)}
      />
    </div>
  );
}

export default OrdersPage;
