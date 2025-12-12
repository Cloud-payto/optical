/**
 * Order Items List Component
 * Displays items within an expanded order with UPC and cost breakdown
 */

import React from 'react';
import { OrderItem } from '../types/order.types';

// Vendors that use SKU instead of UPC
const SKU_ONLY_VENDORS = ['ClearVision', 'clearvision', 'CLEARVISION'];

interface OrderItemsListProps {
  items: OrderItem[];
  vendor?: string;
}

export function OrderItemsList({ items, vendor }: OrderItemsListProps) {
  // Check if this vendor uses SKU instead of UPC
  const usesSku = vendor ? SKU_ONLY_VENDORS.some(v => v.toLowerCase() === vendor.toLowerCase()) : false;
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
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
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                {usesSku ? (
                  <span className="flex items-center gap-1 group relative cursor-help">
                    SKU
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-xl z-[9999] pointer-events-none">
                      This vendor uses SKU codes instead of UPC barcodes
                    </span>
                  </span>
                ) : (
                  'UPC'
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Brand</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Model</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Color</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Size</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Qty</th>
              {hasAnyPrices && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Subtotal</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.map((item, index) => {
              const itemSubtotal = (item.wholesale_price || 0) * item.quantity;

              return (
                <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                    {usesSku ? (
                      <span className="group relative cursor-help">
                        {item.sku || item.upc || 'N/A'}
                        <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-40 p-2 bg-gray-900 text-white text-xs rounded shadow-xl z-[9999] pointer-events-none">
                          SKU (not a UPC barcode)
                        </span>
                      </span>
                    ) : (
                      item.upc || item.sku || 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-sm text-gray-900 dark:text-white">{item.brand}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.model}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.color}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.size}</td>
                  <td className="px-4 py-3 text-right font-semibold text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                  {hasAnyPrices && (
                    <>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                        {item.wholesale_price != null && item.wholesale_price > 0
                          ? `$${item.wholesale_price.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-sm text-gray-900 dark:text-white">
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 w-80">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{totalQuantity} units</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Order Subtotal:</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">${totalValue.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                * Based on wholesale prices. Actual costs may vary.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
