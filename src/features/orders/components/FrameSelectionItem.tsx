/**
 * Frame Selection Item Component
 * Individual frame card with checkbox for selection during order confirmation
 */

import React from 'react';
import { OrderItem } from '../types/order.types';
import { Package } from 'lucide-react';

interface FrameSelectionItemProps {
  item: OrderItem;
  isSelected: boolean;
  onToggle: () => void;
}

export function FrameSelectionItem({ item, isSelected, onToggle }: FrameSelectionItemProps) {
  return (
    <label
      className={`
        flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-400'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1F2623] hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#1F2623] cursor-pointer"
          aria-label={`Select ${item.brand} ${item.model}`}
        />
      </div>

      {/* Frame Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {item.brand} {item.model}
              </h4>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {/* UPC/SKU */}
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  {item.upc ? 'UPC' : 'SKU'}:
                </span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                  {item.upc || item.sku}
                </span>
              </div>

              {/* Color */}
              <div>
                <span className="text-gray-500 dark:text-gray-400">Color:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.color}
                </span>
              </div>

              {/* Size */}
              <div>
                <span className="text-gray-500 dark:text-gray-400">Size:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.size}
                </span>
              </div>

              {/* Quantity */}
              <div>
                <span className="text-gray-500 dark:text-gray-400">Qty:</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </span>
              </div>

              {/* Wholesale Price (if available) */}
              {item.wholesale_price && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Price:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${item.wholesale_price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <div className="flex-shrink-0">
              <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                Selected
              </div>
            </div>
          )}
        </div>
      </div>
    </label>
  );
}
