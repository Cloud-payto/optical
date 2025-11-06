/**
 * Order Actions Dropdown Component
 * Provides actions for confirming, archiving, and deleting orders
 */

import React, { useState } from 'react';
import { MoreVertical, Check, Archive, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Order } from '../types/order.types';

interface OrderActionsProps {
  order: Order;
  onConfirm?: (orderNumber: string) => void;
  onArchive?: (orderId: number) => void;
  onDelete?: (orderId: number) => void;
}

type ConfirmAction = 'confirm' | 'archive' | 'delete' | null;

export function OrderActions({ order, onConfirm, onArchive, onDelete }: OrderActionsProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmAction('confirm');
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmAction('archive');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmAction('delete');
  };

  const executeAction = () => {
    if (confirmAction === 'confirm' && onConfirm) {
      onConfirm(order.order_number);
    } else if (confirmAction === 'archive' && onArchive) {
      onArchive(order.id);
    } else if (confirmAction === 'delete' && onDelete) {
      onDelete(order.id);
    }
  };

  const getDialogConfig = () => {
    switch (confirmAction) {
      case 'confirm':
        return {
          title: 'Confirm Order',
          message: `Are you sure you want to confirm order ${order.order_number} from ${order.vendor}? This will move all items to your current inventory.`,
          confirmText: 'Confirm Order',
          variant: 'success' as const,
        };
      case 'archive':
        return {
          title: 'Archive Order',
          message: `Are you sure you want to archive order ${order.order_number} from ${order.vendor}? You can restore it later if needed.`,
          confirmText: 'Archive Order',
          variant: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Delete Order',
          message: `Are you sure you want to delete order ${order.order_number} from ${order.vendor}? This action cannot be undone.`,
          confirmText: 'Delete Order',
          variant: 'danger' as const,
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: '',
          variant: 'warning' as const,
        };
    }
  };

  const dialogConfig = getDialogConfig();

  return (
    <>
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

      {/* Modern Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        variant={dialogConfig.variant}
      />
    </>
  );
}
