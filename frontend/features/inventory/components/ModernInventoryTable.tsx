import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Archive, Trash2, RotateCcw, DollarSign } from 'lucide-react';
import type { InventoryItem } from '../types/inventory.types';
import {
  calculateReturnWindow,
  getReturnWindowEmoji,
  getReturnWindowColorClass,
  formatReturnWindowDate
} from '../utils/returnWindow';

interface ModernInventoryTableProps {
  items: InventoryItem[];
  onAddToReturnReport?: (item: InventoryItem) => void;
  onArchive?: (itemId: string) => void;
  onRestore?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onMarkAsSold?: (itemId: string) => void;
  isLoading?: boolean;
  isDemo?: boolean; // Demo mode flag
}

export function ModernInventoryTable({
  items,
  onAddToReturnReport,
  onArchive,
  onRestore,
  onDelete,
  onMarkAsSold,
  isLoading = false,
  isDemo = false
}: ModernInventoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [demoLocked, setDemoLocked] = useState(false); // Prevent collapse during demo

  // Auto-expand first row in demo mode
  useEffect(() => {
    if (isDemo && items.length > 0) {
      console.log('🎭 ModernInventoryTable: Auto-expanding first frame in demo mode');
      setDemoLocked(true);

      // Expand first item after short delay
      const timer = setTimeout(() => {
        const firstItemId = items[0].id;
        setExpandedRows(new Set([firstItemId]));
        console.log('✅ ModernInventoryTable: First frame expanded:', firstItemId);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setDemoLocked(false);
    }
  }, [isDemo, items]);

  const toggleExpanded = (itemId: string) => {
    // Prevent toggling if demo is active and locked
    if (demoLocked) {
      console.log('🔒 ModernInventoryTable: Toggle blocked during demo mode');
      return;
    }

    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelected = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1F2623] rounded-xl shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading inventory...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1F2623] rounded-xl shadow-sm p-12 text-center">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No inventory found</h3>
        <p className="text-gray-500 dark:text-gray-400">Items will appear here when you receive vendor orders</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1F2623] rounded-xl shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[40px_80px_1.5fr_150px_1fr_100px_100px_180px_140px] gap-4 px-6 py-3 bg-gray-50 dark:bg-[#181F1C]/50 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="flex items-center">#</div>
        <div>Image</div>
        <div>Brand • Model</div>
        <div>UPC</div>
        <div>Color</div>
        <div>Size</div>
        <div>Stock</div>
        <div>Return Window</div>
        <div>Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item) => {
          const isExpanded = expandedRows.has(item.id);
          const isSelected = selectedItems.has(item.id);
          const returnWindow = calculateReturnWindow(item.order?.order_date);

          return (
            <div
              key={item.id}
              className={`transition-colors ${
                isExpanded ? 'bg-purple-50/30 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {/* Collapsed Row */}
              <div className="grid grid-cols-[40px_80px_1.5fr_150px_1fr_100px_100px_180px_140px] gap-4 px-6 py-4 items-center">
                {/* Checkbox */}
                <div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(item.id)}
                    className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                </div>

                {/* Image Placeholder */}
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                  No Img
                </div>

                {/* Brand • Model */}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.brand || 'Unknown Brand'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.model || 'Unknown Model'}</div>
                </div>

                {/* UPC */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.upc || 'N/A'}</div>

                {/* Color */}
                <div className="text-sm text-gray-700 dark:text-gray-300">{item.color || 'N/A'}</div>

                {/* Size */}
                <div className="text-sm text-gray-700 dark:text-gray-300">{item.size || 'N/A'}</div>

                {/* Stock */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.quantity} {item.quantity === 1 ? 'pc' : 'pcs'}
                </div>

                {/* Return Window */}
                <div>
                  {returnWindow ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getReturnWindowEmoji(returnWindow.status)}</span>
                      <span className={`text-sm font-medium ${returnWindow.status === 'expired' ? 'text-gray-500 dark:text-gray-400' : 'dark:text-gray-200'}`}>
                        {returnWindow.displayText}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">No date</span>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1">
                  {/* Return Report Quick Button (for current items with valid return window) */}
                  {onAddToReturnReport && returnWindow && returnWindow.status !== 'expired' && item.status === 'current' && (
                    <button
                      data-demo="add-to-return"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToReturnReport(item);
                      }}
                      className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 transition-colors"
                      title="Add to Return Report"
                    >
                      <span className="text-base">🔄</span>
                    </button>
                  )}

                  {/* Archive Quick Button (for current items) */}
                  {onArchive && item.status === 'current' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(item.id);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}

                  {/* Mark as Sold Quick Button (for current items) */}
                  {onMarkAsSold && item.status === 'current' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsSold(item.id);
                      }}
                      className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 transition-colors"
                      title="Mark as Sold"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}

                  {/* Restore Quick Button (for archived items) */}
                  {onRestore && item.status === 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(item.id);
                      }}
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    data-demo="frame-expand-btn"
                    data-frame-id={item.id}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="View Details"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="px-6 pb-6 bg-white dark:bg-[#1F2623] border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-[200px_1fr] gap-8 pt-6">
                    {/* Left: Image Placeholder */}
                    <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-xs">No Image</div>
                      </div>
                    </div>

                    {/* Right: Details Grid */}
                    <div className="space-y-6">
                      {/* Header with Brand */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.brand} - {item.model}
                        </h3>

                        {/* Return Window - Moved under brand */}
                        {returnWindow && (
                          <div className="mt-3">
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${getReturnWindowColorClass(returnWindow.status)}`}>
                              <span className="text-lg">{getReturnWindowEmoji(returnWindow.status)}</span>
                              <div>
                                <span className="font-medium">{returnWindow.displayText}</span>
                                <div className="text-xs opacity-75">
                                  Expires: {formatReturnWindowDate(returnWindow.expiresDate)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="h-px bg-gray-200 dark:bg-gray-700 mt-4"></div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                        {/* Basic Info */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Color</div>
                          <div className="text-sm text-gray-900 dark:text-white">{item.color || 'N/A'}</div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Size</div>
                          <div className="text-sm text-gray-900 dark:text-white">{item.size || 'N/A'}</div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SKU</div>
                          <div className="text-sm text-gray-900 dark:text-white">{item.sku || 'N/A'}</div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">UPC</div>
                          <div className="text-sm text-gray-900 dark:text-white">{item.upc || 'N/A'}</div>
                        </div>

                        {/* Separator */}
                        <div className="col-span-2 h-px bg-gray-200 dark:bg-gray-700"></div>

                        {/* Vendor Info */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vendor</div>
                          <div className="text-sm text-gray-900 dark:text-white">{item.vendor?.name || 'N/A'}</div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Brand</div>
                          <div className="text-sm text-gray-900 dark:text-white">{item.brand || 'N/A'}</div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Order Date</div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.order?.order_date
                              ? new Date(item.order.order_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="col-span-2 h-px bg-gray-200 dark:bg-gray-700"></div>

                        {/* Pricing Info */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Wholesale Cost</div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.wholesale_price ? `$${item.wholesale_price.toFixed(2)}` : 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Discount</div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.discount_percentage ? `${item.discount_percentage}%` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mt-4">
                          {/* Return Report Button (for current items with valid return window) */}
                          {onAddToReturnReport && returnWindow && returnWindow.status !== 'expired' && item.status === 'current' && (
                            <button
                              onClick={() => onAddToReturnReport(item)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                            >
                              <span>🔄</span>
                              <span>Add to Return Report</span>
                            </button>
                          )}

                          {/* Archive Button (for current items) */}
                          {onArchive && item.status === 'current' && (
                            <button
                              onClick={() => onArchive(item.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                              <span>Archive</span>
                            </button>
                          )}

                          {/* Restore Button (for archived items) */}
                          {onRestore && item.status === 'archived' && (
                            <button
                              onClick={() => onRestore(item.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Restore</span>
                            </button>
                          )}

                          {/* Mark as Sold Button (for current items) */}
                          {onMarkAsSold && item.status === 'current' && (
                            <button
                              onClick={() => onMarkAsSold(item.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>Mark as Sold</span>
                            </button>
                          )}

                          {/* Delete Button (always available) */}
                          {onDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                                  onDelete(item.id);
                                }
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
