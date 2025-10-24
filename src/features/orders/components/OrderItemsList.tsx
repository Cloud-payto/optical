/**
 * Order Items List Component
 * Displays items within an expanded order
 */

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderItem } from '../types/order.types';

interface OrderItemsListProps {
  items: OrderItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No items in this order
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-gray-700">Order Items ({items.length})</h4>
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs">SKU</TableHead>
              <TableHead className="text-xs">Brand</TableHead>
              <TableHead className="text-xs">Model</TableHead>
              <TableHead className="text-xs">Color</TableHead>
              <TableHead className="text-xs">Size</TableHead>
              <TableHead className="text-xs text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id || index} className="text-sm">
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.brand}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.color}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
