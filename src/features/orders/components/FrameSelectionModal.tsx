/**
 * Frame Selection Modal Component
 * Compact, paper-like table layout for selecting received frames
 * Optimized for scanning large orders with minimal scrolling
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { Order } from '../types/order.types';
import { FrameSelectionItem } from './FrameSelectionItem';

interface FrameSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onConfirm: (frameIds: string[]) => void;
  isLoading?: boolean;
}

export function FrameSelectionModal({
  isOpen,
  onClose,
  order,
  onConfirm,
  isLoading = false
}: FrameSelectionModalProps) {
  // Initialize with all frames selected by default
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());

  // Initialize selection when modal opens or order changes
  useEffect(() => {
    if (isOpen && order?.items) {
      // For partial orders, select only pending items. For new orders, select all.
      if (order.status === 'partial' && order.pending_items) {
        // Select items that are still pending (not received yet)
        const pendingItems = order.items.slice(-order.pending_items);
        setSelectedFrames(new Set(pendingItems.map(item => item.id.toString())));
      } else {
        // Select all items for new orders
        setSelectedFrames(new Set(order.items.map(item => item.id.toString())));
      }
    }
  }, [isOpen, order]);

  const toggleFrame = (frameId: string) => {
    setSelectedFrames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(frameId)) {
        newSet.delete(frameId);
      } else {
        newSet.add(frameId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedFrames.size === order.items.length) {
      // Deselect all
      setSelectedFrames(new Set());
    } else {
      // Select all
      setSelectedFrames(new Set(order.items.map(item => item.id.toString())));
    }
  };

  const handleConfirm = () => {
    if (selectedFrames.size === 0) {
      return; // Validation: prevent confirmation with 0 frames
    }
    onConfirm(Array.from(selectedFrames));
  };

  const allSelected = selectedFrames.size === order.items.length;
  const noneSelected = selectedFrames.size === 0;

  // Check if any item has wholesale price for conditional column rendering
  const hasWholesalePrice = order.items.some(item => item.wholesale_price !== undefined);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - Wider for table layout */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-6xl max-h-[90vh] rounded-xl bg-white dark:bg-[#1F2623] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - More Compact */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md flex-shrink-0">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {order.status === 'partial' ? 'Complete Partial Order' : 'Select Received Frames'}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {order.vendor} - Order #{order.order_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-4"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Selection Summary Bar - More Compact */}
            <div className="px-6 py-3 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-bold text-gray-900 dark:text-white text-base">
                      {selectedFrames.size}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      of {order.items.length} selected
                    </span>
                  </div>
                  {order.status === 'partial' && order.received_items && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      {order.received_items} already received
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleAll}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F2623] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allSelected ? (
                    <>
                      <Square className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Select All
                    </>
                  )}
                </button>
              </div>

              {/* Validation Warning */}
              {noneSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-700 dark:text-red-300">
                    Please select at least one frame to confirm
                  </span>
                </motion.div>
              )}
            </div>

            {/* Scrollable Table - Paper-like Layout */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse">
                {/* Sticky Header */}
                <thead className="sticky top-0 bg-gray-200 dark:bg-gray-800 z-10 border-b-2 border-gray-400 dark:border-gray-600 shadow-sm">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-left">
                      <div className="sr-only">Select</div>
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      UPC/SKU
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Brand
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Model
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Color
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Size
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Qty
                    </th>
                    {hasWholesalePrice && (
                      <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Price
                      </th>
                    )}
                  </tr>
                </thead>

                {/* Table Body - Zebra Striping */}
                <tbody>
                  {order.items.map((item, index) => (
                    <FrameSelectionItem
                      key={item.id}
                      item={item}
                      index={index}
                      isSelected={selectedFrames.has(item.id.toString())}
                      onToggle={() => toggleFrame(item.id.toString())}
                    />
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {order.items.length === 0 && (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No items in this order</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - More Compact */}
            <div className="flex items-center justify-between px-6 py-3 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {selectedFrames.size === order.items.length
                  ? 'All frames will be confirmed'
                  : selectedFrames.size > 0
                  ? `${selectedFrames.size} frame${selectedFrames.size !== 1 ? 's' : ''} will be confirmed`
                  : 'No frames selected'}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={noneSelected || isLoading}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      Confirm {selectedFrames.size} Frame{selectedFrames.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
