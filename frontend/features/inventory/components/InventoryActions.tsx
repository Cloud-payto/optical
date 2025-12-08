/**
 * Inventory Actions Dropdown Component
 * Provides actions for managing inventory items
 */

import React from 'react';
import { MoreVertical, Archive, RotateCcw, Trash2, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { InventoryItem } from '../types/inventory.types';

interface InventoryActionsProps {
  item: InventoryItem;
  onArchive?: (itemId: number) => void;
  onRestore?: (itemId: number) => void;
  onDelete?: (itemId: string) => void;
  onMarkAsSold?: (itemId: number) => void;
}

export function InventoryActions({ item, onArchive, onRestore, onDelete, onMarkAsSold }: InventoryActionsProps) {
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive && confirm(`Archive ${item.brand} ${item.model}?`)) {
      onArchive(Number(item.id));
    }
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRestore && confirm(`Restore ${item.brand} ${item.model} to current inventory?`)) {
      onRestore(Number(item.id));
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete ${item.brand} ${item.model}? This action cannot be undone.`)) {
      onDelete(item.id);
    }
  };

  const handleMarkAsSold = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsSold && confirm(`Mark ${item.brand} ${item.model} as sold?`)) {
      onMarkAsSold(Number(item.id));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-md transition-colors">
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {item.status === 'current' && onMarkAsSold && (
          <>
            <DropdownMenuItem onClick={handleMarkAsSold} className="cursor-pointer">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Mark as Sold
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {item.status === 'current' && onArchive && (
          <>
            <DropdownMenuItem onClick={handleArchive} className="cursor-pointer">
              <Archive className="h-4 w-4 mr-2 text-blue-600" />
              Archive Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {item.status === 'archived' && onRestore && (
          <>
            <DropdownMenuItem onClick={handleRestore} className="cursor-pointer">
              <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
              Restore Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {onDelete && (
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Item
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
