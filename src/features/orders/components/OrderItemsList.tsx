/**
 * Order Items List Component
 * Displays items within an expanded order with UPC and cost breakdown
 */

import React from 'react';
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

  // Sort items by brand, then by model
  const sortedItems = [...items].sort((a, b) => {
    // First sort by brand
    const brandCompare = (a.brand || '').localeCompare(b.brand || '');
    if (brandCompare !== 0) return brandCompare;

    // Then sort by model within the same brand
    return (a.model || '').localeCompare(b.model || '');
  });

  // Calculate totals
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => {
    return sum + ((item.wholesale_price || 0) * item.quantity);
  }, 0);

  const hasAnyPrices = items.some(item => item.wholesale_price != null && item.wholesale_price > 0);

  return (
    <div className="space-y-4">
      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">UPC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Brand</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Model</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Color</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
              {hasAnyPrices && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedItems.map((item, index) => {
              const itemSubtotal = (item.wholesale_price || 0) * item.quantity;

              return (
                <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {item.upc || item.sku || 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-medium text-sm text-gray-900">{item.brand}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.model}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.color}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.size}</td>
                  <td className="px-4 py-3 text-right font-semibold text-sm text-gray-900">{item.quantity}</td>
                  {hasAnyPrices && (
                    <>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {item.wholesale_price != null && item.wholesale_price > 0
                          ? `$${item.wholesale_price.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-sm text-gray-900">
                        {item.wholesale_price != null && item.wholesale_price > 0
                          ? `$${itemSubtotal.toFixed(2)}`
                          : '-'}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      {hasAnyPrices && (
        <div className="flex justify-end">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-80">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-semibold text-gray-900">{totalQuantity} units</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-700">Order Subtotal:</span>
                <span className="font-bold text-lg text-blue-600">${totalValue.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-2">
                * Based on wholesale prices. Actual costs may vary.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
