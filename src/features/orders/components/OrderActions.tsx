/**
 * Order Actions Dropdown Component
 * Provides actions for confirming, archiving, and deleting orders
 */

import React from 'react';
import { MoreVertical, Check, Archive, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Order } from '../types/order.types';

interface OrderActionsProps {
  order: Order;
  onConfirm?: (orderNumber: string) => void;
  onArchive?: (orderId: number) => void;
  onDelete?: (orderId: number) => void;
}

export function OrderActions({ order, onConfirm, onArchive, onDelete }: OrderActionsProps) {
  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConfirm && confirm(`Confirm order ${order.order_number}? This will move all items to current inventory.`)) {
      onConfirm(order.order_number);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive && confirm(`Archive order ${order.order_number}?`)) {
      onArchive(order.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete order ${order.order_number}? This action cannot be undone.`)) {
      onDelete(order.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-md transition-colors">
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {order.status === 'pending' && onConfirm && (
          <>
            <DropdownMenuItem onClick={handleConfirm} className="cursor-pointer">
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Confirm Order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {order.status === 'confirmed' && onArchive && (
          <>
            <DropdownMenuItem onClick={handleArchive} className="cursor-pointer">
              <Archive className="h-4 w-4 mr-2 text-blue-600" />
              Archive Order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {onDelete && (
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Order
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
