/**
 * Modern Inventory Table Component
 * Displays inventory items grouped by vendor and brand
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InventoryItem } from '../types/inventory.types';
import { InventoryActions } from './InventoryActions';

interface InventoryTableProps {
  items: InventoryItem[];
  onArchive?: (itemId: number) => void;
  onRestore?: (itemId: number) => void;
  onDelete?: (itemId: string) => void;
  onMarkAsSold?: (itemId: number) => void;
  isLoading?: boolean;
}

export function InventoryTable({ items, onArchive, onRestore, onDelete, onMarkAsSold, isLoading }: InventoryTableProps) {
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  // Group items by vendor and brand
  const groupedItems = items.reduce((acc, item) => {
    const vendorName = item.vendor?.name || 'Unknown Vendor';
    const brandName = item.brand || 'Unknown Brand';

    if (!acc[vendorName]) {
      acc[vendorName] = {};
    }
    if (!acc[vendorName][brandName]) {
      acc[vendorName][brandName] = [];
    }
    acc[vendorName][brandName].push(item);

    return acc;
  }, {} as Record<string, Record<string, InventoryItem[]>>);

  const toggleVendor = (vendor: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) {
        newSet.delete(vendor);
      } else {
        newSet.add(vendor);
      }
      return newSet;
    });
  };

  const toggleBrand = (vendorBrandKey: string) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorBrandKey)) {
        newSet.delete(vendorBrandKey);
      } else {
        newSet.add(vendorBrandKey);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No inventory items found</h3>
        <p className="text-gray-500 dark:text-gray-400">Inventory will appear here when orders are confirmed</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Brand / Model</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedItems).map(([vendorName, brands]) => {
            const isVendorExpanded = expandedVendors.has(vendorName);
            const vendorItemCount = Object.values(brands).flat().length;

            return (
              <React.Fragment key={vendorName}>
                {/* Vendor Header Row */}
                <TableRow className="bg-gray-50 dark:bg-[#181F1C]/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => toggleVendor(vendorName)}>
                  <TableCell>
                    {isVendorExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell colSpan={7} className="font-semibold dark:text-white">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      {vendorName}
                      <Badge variant="secondary" className="ml-2">{vendorItemCount} items</Badge>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Brand Rows (if vendor expanded) */}
                {isVendorExpanded && Object.entries(brands).map(([brandName, brandItems]) => {
                  const brandKey = `${vendorName}-${brandName}`;
                  const isBrandExpanded = expandedBrands.has(brandKey);

                  return (
                    <React.Fragment key={brandKey}>
                      {/* Brand Header Row */}
                      <TableRow className="bg-gray-25 dark:bg-[#1F2623]/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => toggleBrand(brandKey)}>
                        <TableCell className="pl-8">
                          {isBrandExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell colSpan={7} className="font-medium text-gray-700 dark:text-gray-300">
                          {brandName}
                          <Badge variant="outline" className="ml-2">{brandItems.length} items</Badge>
                        </TableCell>
                      </TableRow>

                      {/* Item Rows (if brand expanded) */}
                      {isBrandExpanded && brandItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <TableCell className="pl-12"></TableCell>
                          <TableCell className="font-mono text-xs dark:text-gray-300">{item.sku}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium dark:text-white">{item.brand}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{item.model}</div>
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-gray-300">{item.color || 'N/A'}</TableCell>
                          <TableCell className="dark:text-gray-300">{item.size || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell>
                            {item.wholesale_price ? (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                <DollarSign className="h-4 w-4" />
                                {item.wholesale_price.toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">N/A</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <InventoryActions
                              item={item}
                              onArchive={onArchive}
                              onRestore={onRestore}
                              onDelete={onDelete}
                              onMarkAsSold={onMarkAsSold}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
