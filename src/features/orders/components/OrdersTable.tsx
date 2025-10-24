/**
 * Modern Orders Table Component
 * Displays orders in a clean, expandable table format
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Calendar, User, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Order } from '../types/order.types';
import { OrderActions } from './OrderActions';
import { OrderItemsList } from './OrderItemsList';

interface OrdersTableProps {
  orders: Order[];
  onConfirm?: (orderNumber: string) => void;
  onArchive?: (orderId: number) => void;
  onDelete?: (orderId: number) => void;
  isLoading?: boolean;
}

export function OrdersTable({ orders, onConfirm, onArchive, onDelete, isLoading }: OrdersTableProps) {
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      confirmed: 'default',
      archived: 'secondary',
    };
    
    return (
      <Badge variant={variants[status] || 'default'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500">Orders will appear here when you receive vendor emails</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Order #</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            
            return (
              <React.Fragment key={order.id}>
                <TableRow className="hover:bg-gray-50 cursor-pointer">
                  <TableCell onClick={() => toggleExpanded(order.id)}>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium" onClick={() => toggleExpanded(order.id)}>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      {order.order_number}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => toggleExpanded(order.id)}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{order.vendor}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => toggleExpanded(order.id)}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {order.customer_name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => toggleExpanded(order.id)}>
                    <Badge variant="secondary">{order.total_items} items</Badge>
                  </TableCell>
                  <TableCell onClick={() => toggleExpanded(order.id)}>
                    {order.order_date ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.order_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell onClick={() => toggleExpanded(order.id)}>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <OrderActions
                      order={order}
                      onConfirm={onConfirm}
                      onArchive={onArchive}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-50 p-4">
                      <OrderItemsList items={order.items} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
