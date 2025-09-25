import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Save, Percent } from 'lucide-react';
import { Brand } from '../../types';

interface BrandDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
  companyName: string;
  onSave: (updatedBrand: Brand) => void;
}

const BrandDetailsModal: React.FC<BrandDetailsModalProps> = ({
  isOpen,
  onClose,
  brand,
  companyName,
  onSave
}) => {
  const [formData, setFormData] = useState<Brand>({
    id: '',
    name: '',
    wholesaleCost: 0,
    yourCost: 0,
    tariffTax: 0,
    retailPrice: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTariffEnabled, setIsTariffEnabled] = useState(false);

  useEffect(() => {
    if (brand && isOpen) {
      const tariffValue = brand.tariffTax || 0;
      setFormData({
        ...brand,
        wholesaleCost: brand.wholesaleCost || 0,
        yourCost: brand.yourCost || 0,
        tariffTax: tariffValue,
        retailPrice: brand.retailPrice || 0,
        notes: brand.notes || ''
      });
      setIsTariffEnabled(tariffValue > 0);
      setErrors({});
    }
  }, [brand, isOpen]);

  // Calculate discount percentage
  const calculateDiscountPercentage = (wholesale: number, yourCost: number): number => {
    if (wholesale <= 0 || yourCost >= wholesale) return 0;
    return Math.round(((wholesale - yourCost) / wholesale) * 100);
  };

  const discountPercentage = calculateDiscountPercentage(
    formData.wholesaleCost || 0,
    formData.yourCost || 0
  );

  const handleInputChange = (field: keyof Brand, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTariffToggle = () => {
    const newEnabled = !isTariffEnabled;
    setIsTariffEnabled(newEnabled);
    
    // Reset tariff tax to 0 when disabled
    if (!newEnabled) {
      setFormData(prev => ({ ...prev, tariffTax: 0 }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.wholesaleCost || formData.wholesaleCost <= 0) {
      newErrors.wholesaleCost = 'Wholesale cost must be greater than 0';
    }

    if (!formData.yourCost || formData.yourCost <= 0) {
      newErrors.yourCost = 'Your cost must be greater than 0';
    }

    if (formData.yourCost && formData.wholesaleCost && formData.yourCost >= formData.wholesaleCost) {
      newErrors.yourCost = 'Your cost should be less than wholesale cost';
    }

    // Validate tariff tax
    if (isTariffEnabled && (formData.tariffTax < 0 || formData.tariffTax > 100)) {
      newErrors.tariffTax = 'Tariff tax must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!brand) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{formData.name}</h3>
                <p className="text-sm text-gray-500">{companyName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Wholesale Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wholesale Cost
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      errors.wholesaleCost ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.wholesaleCost}
                    onChange={(e) => handleInputChange('wholesaleCost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                {errors.wholesaleCost && (
                  <p className="mt-1 text-sm text-red-600">{errors.wholesaleCost}</p>
                )}
              </div>

              {/* Your Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Cost
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      errors.yourCost ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.yourCost}
                    onChange={(e) => handleInputChange('yourCost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                {errors.yourCost && (
                  <p className="mt-1 text-sm text-red-600">{errors.yourCost}</p>
                )}
              </div>

              {/* Discount Percentage Display */}
              {formData.wholesaleCost > 0 && formData.yourCost > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Percent className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Discount Percentage: {discountPercentage}%
                      </p>
                      <p className="text-xs text-green-600">
                        You save ${((formData.wholesaleCost || 0) - (formData.yourCost || 0)).toFixed(2)} per frame
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Retail Price (MSRP) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retail Price (MSRP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      errors.retailPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.retailPrice}
                    onChange={(e) => handleInputChange('retailPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                {errors.retailPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.retailPrice}</p>
                )}
              </div>

              {/* Tariff Tax Toggle and Input */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Tariff Tax
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Enable tariff tax</span>
                    <button
                      type="button"
                      onClick={handleTariffToggle}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isTariffEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          isTariffEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {isTariffEnabled && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                        errors.tariffTax ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.tariffTax}
                      onChange={(e) => handleInputChange('tariffTax', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                )}
                
                {errors.tariffTax && (
                  <p className="mt-1 text-sm text-red-600">{errors.tariffTax}</p>
                )}
                
                {!isTariffEnabled && (
                  <p className="text-xs text-gray-500 italic">
                    Toggle on to add tariff tax to this brand
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any notes about this brand..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BrandDetailsModal;