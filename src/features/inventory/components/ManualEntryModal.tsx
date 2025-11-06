/**
 * Manual Entry Modal Component
 * Allows users to manually add frames to inventory
 */

import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualInventoryData) => Promise<void>;
}

export interface ManualInventoryData {
  vendor: string;
  brand: string;
  model: string;
  color: string;
  size?: string;
  sku?: string;
  quantity: number;
  cost?: number;
  retail_price?: number;
  order_number?: string;
  notes?: string;
}

export function ManualEntryModal({ isOpen, onClose, onSubmit }: ManualEntryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ManualInventoryData>({
    vendor: '',
    brand: '',
    model: '',
    color: '',
    size: '',
    sku: '',
    quantity: 1,
    cost: undefined,
    retail_price: undefined,
    order_number: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'cost' || name === 'retail_price'
        ? value ? parseFloat(value) : undefined
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.vendor || !formData.brand || !formData.model || !formData.color) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);

      // Reset form and close modal
      setFormData({
        vendor: '',
        brand: '',
        model: '',
        color: '',
        size: '',
        sku: '',
        quantity: 1,
        cost: undefined,
        retail_price: undefined,
        order_number: '',
        notes: '',
      });

      toast.success('Frame added to inventory successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding frame:', error);
      toast.error('Failed to add frame to inventory');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Frame Manually</h2>
            <p className="text-sm text-gray-500 mt-1">Enter frame details to add to inventory</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Required Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <input
                id="vendor"
                name="vendor"
                type="text"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Modern Optical"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Ray-Ban"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                id="model"
                name="model"
                type="text"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., RB2140"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <input
                id="color"
                name="color"
                type="text"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tortoise"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <input
                id="size"
                name="size"
                type="text"
                value={formData.size}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 52-20"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., RB2140-902"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Pricing Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Cost (Your Price)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="retail_price" className="block text-sm font-medium text-gray-700 mb-1">
                Retail Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  id="retail_price"
                  name="retail_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.retail_price || ''}
                  onChange={handleChange}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div>
            <label htmlFor="order_number" className="block text-sm font-medium text-gray-700 mb-1">
              Order Number (Optional)
            </label>
            <input
              id="order_number"
              name="order_number"
              type="text"
              value={formData.order_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., ORD-12345"
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information..."
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add to Inventory</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
