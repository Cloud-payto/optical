/**
 * Modern Orders Table Component
 * Displays orders in a clean, expandable table format with sleek modern design
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Calendar, User, Hash, ShoppingBag } from 'lucide-react';
import { Order } from '../types/order.types';
import { OrderActions } from './OrderActions';
import { SensitiveText } from '../../../components/ui/SensitiveText';
import { OrderItemsList } from './OrderItemsList';
import { PartialOrderBadge } from './PartialOrderBadge';

interface OrdersTableProps {
  orders: Order[];
  onConfirm?: (orderNumber: string, frameIds?: string[]) => void;
  onArchive?: (orderId: number) => void;
  onDelete?: (orderId: number) => void;
  isLoading?: boolean;
  isConfirming?: boolean;
}

export function OrdersTable({
  orders,
  onConfirm,
  onArchive,
  onDelete,
  isLoading,
  isConfirming = false
}: OrdersTableProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const toggleExpanded = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      partial: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      confirmed: 'bg-blue-600 text-white dark:bg-blue-700',
      archived: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    };

    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
        <p className="text-gray-500 dark:text-gray-400">Orders will appear here when you receive vendor emails</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);

              return (
                <React.Fragment key={order.id}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Expand/Collapse Button */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleExpanded(order.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Order Number */}
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <SensitiveText type="order" className="font-medium text-gray-900 dark:text-white">{order.order_number}</SensitiveText>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-white">{order.vendor}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <SensitiveText type="customer" className="text-gray-700 dark:text-gray-300">{order.customer_name || 'N/A'}</SensitiveText>
                      </div>
                    </td>

                    {/* Items Count */}
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {order.total_items > 0 ? (
                          <span className="font-medium">{order.total_items} items</span>
                        ) : (
                          <span className="text-gray-400">items</span>
                        )}
                      </div>
                    </td>

                    {/* Order Date */}
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      {order.order_date ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(order.order_date).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      {order.status === 'partial' && order.received_items && order.total_items ? (
                        <PartialOrderBadge
                          receivedItems={order.received_items}
                          totalItems={order.total_items}
                        />
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeStyle(order.status)}`}>
                          {order.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <OrderActions
                        order={order}
                        onConfirm={onConfirm}
                        onArchive={onArchive}
                        onDelete={onDelete}
                        isConfirming={isConfirming}
                      />
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td colSpan={8} className="px-4 py-6">
                        <div className="bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                          {/* Order Details Header */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Details</h3>
                            </div>
                            {/* Order Summary Info */}
                            <div className="text-right space-y-1">
                              {order.account_number && (
                                <div className="text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Account #:</span>{' '}
                                  <SensitiveText type="account" className="font-mono font-semibold text-gray-900 dark:text-white">{order.account_number}</SensitiveText>
                                </div>
                              )}
                              {order.rep_name && (
                                <div className="text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Rep:</span>{' '}
                                  <span className="font-medium text-gray-900 dark:text-white">{order.rep_name}</span>
                                </div>
                              )}
                              {order.status === 'partial' && order.pending_items && (
                                <div className="text-sm">
                                  <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                    {order.pending_items} item{order.pending_items !== 1 ? 's' : ''} pending
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <OrderItemsList items={order.items} vendor={order.vendor} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
