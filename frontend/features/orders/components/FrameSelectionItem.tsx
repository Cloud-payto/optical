/**
 * Frame Selection Item Component
 * Compact table row for frame selection during order confirmation
 * Paper-like design for easy scanning of large orders
 */

import React from 'react';
import { OrderItem } from '../types/order.types';

interface FrameSelectionItemProps {
  item: OrderItem;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}

export function FrameSelectionItem({ item, index, isSelected, onToggle }: FrameSelectionItemProps) {
  return (
    <tr
      onClick={onToggle}
      className={`
        cursor-pointer transition-all duration-150 border-b border-gray-200 dark:border-gray-700
        ${isSelected
          ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40'
          : index % 2 === 0
            ? 'bg-white dark:bg-[#1F2623] hover:bg-gray-50 dark:hover:bg-gray-800'
            : 'bg-gray-50 dark:bg-[#181F1C] hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Checkbox Column */}
      <td className="px-3 py-2 w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
          aria-label={`Select ${item.brand} ${item.model}`}
        />
      </td>

      {/* UPC/SKU Column */}
      <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
        <div className="truncate" title={item.upc || item.sku}>
          {item.upc || item.sku}
        </div>
      </td>

      {/* Brand Column */}
      <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
        <div className="truncate" title={item.brand}>
          {item.brand}
        </div>
      </td>

      {/* Model Column */}
      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
        <div className="truncate" title={item.model}>
          {item.model}
        </div>
      </td>

      {/* Color Column */}
      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
        <div className="truncate" title={item.color}>
          {item.color}
        </div>
      </td>

      {/* Size Column */}
      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 text-center">
        {item.size}
      </td>

      {/* Quantity Column */}
      <td className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white text-right">
        {item.quantity}
      </td>

      {/* Price Column (Optional) */}
      {item.wholesale_price != null && (
        <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 text-right">
          ${item.wholesale_price.toFixed(2)}
        </td>
      )}
    </tr>
  );
}
