/**
 * Partial Order Badge Component
 * Displays partial order status with progress indicator
 */

import React from 'react';
import { Package } from 'lucide-react';

interface PartialOrderBadgeProps {
  receivedItems: number;
  totalItems: number;
  className?: string;
}

export function PartialOrderBadge({ receivedItems, totalItems, className = '' }: PartialOrderBadgeProps) {
  const percentage = Math.round((receivedItems / totalItems) * 100);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-orange-300 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20 ${className}`}
    >
      <Package className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
      <div className="flex flex-col">
        <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide">
          Partial
        </span>
        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
          {receivedItems} of {totalItems} ({percentage}%)
        </span>
      </div>
    </div>
  );
}
