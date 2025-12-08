/**
 * Return Report Modal
 * Preview frames grouped by vendor before generating return reports
 */

import React, { useMemo } from 'react';
import { X, Download, Package } from 'lucide-react';
import type { InventoryItem } from '../types/inventory.types';

interface ReturnReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onGenerateReport: (vendorName: string, items: InventoryItem[]) => void;
}

interface GroupedItems {
  [vendorName: string]: InventoryItem[];
}

export function ReturnReportModal({ isOpen, onClose, items, onGenerateReport }: ReturnReportModalProps) {
  // Group items by vendor
  const groupedByVendor = useMemo(() => {
    const groups: GroupedItems = {};
    items.forEach(item => {
      const vendorName = item.vendor?.name || 'Unknown Vendor';
      if (!groups[vendorName]) {
        groups[vendorName] = [];
      }
      groups[vendorName].push(item);
    });
    return groups;
  }, [items]);

  if (!isOpen) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Return Report Preview</h2>
            <p className="text-purple-100 text-sm mt-1">
              {items.length} frame{items.length !== 1 ? 's' : ''} ({totalItems} unit{totalItems !== 1 ? 's' : ''}) selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No items selected for return</p>
              <p className="text-sm mt-2">Add frames to the return list from the inventory table</p>
            </div>
          ) : (
            Object.entries(groupedByVendor).map(([vendorName, vendorItems]) => {
              const vendorTotal = vendorItems.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div key={vendorName} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Vendor Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{vendorName}</h3>
                      <p className="text-sm text-gray-600">
                        {vendorItems.length} frame{vendorItems.length !== 1 ? 's' : ''} ({vendorTotal} unit{vendorTotal !== 1 ? 's' : ''})
                      </p>
                    </div>
                    <button
                      onClick={() => onGenerateReport(vendorName, vendorItems)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Generate Report
                    </button>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Brand</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Model</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Color</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vendorItems
                          .sort((a, b) => {
                            // Sort by brand, then model
                            const brandCompare = (a.brand || '').localeCompare(b.brand || '');
                            if (brandCompare !== 0) return brandCompare;
                            return (a.model || '').localeCompare(b.model || '');
                          })
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.brand || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{item.model || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                  {item.color_code && (
                                    <div
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{ backgroundColor: item.color_code }}
                                      title={item.color_code}
                                    />
                                  )}
                                  <span>{item.color || '-'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{item.full_size || item.size || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{item.quantity}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Reports will be saved to the Returns section in the sidebar
          </p>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
